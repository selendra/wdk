// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

import { BridgeProtocol } from '@tetherto/wdk-wallet/protocols'
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'
import { WalletAccountEvmErc4337, WalletAccountReadOnlyEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337'

import { addressToBytes32, Options } from '@layerzerolabs/lz-v2-utilities'
import { JsonRpcProvider, BrowserProvider, Contract, getBytes, decodeBase58, zeroPadValue, toBeHex, Network } from 'ethers'
import { Address } from '@ton/core'
import { TronWeb } from 'tronweb'

import { OFT_ABI, TRANSACTION_VALUE_HELPER_ABI } from './abi.js'
import { FEE_TOLERANCE, BLOCKCHAINS } from './config.js'
import { SELENDRA_MAINNET, SELENDRA_TESTNET } from '@selendra/wdk-chains-selendra'

/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeProtocolConfig} BridgeProtocolConfig */
/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeResult} BridgeResult */

/** @typedef {import('@tetherto/wdk-wallet-evm').WalletAccountReadOnlyEvm} WalletAccountReadOnlyEvm */

/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletPaymasterTokenConfig} EvmErc4337WalletPaymasterTokenConfig */
/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletSponsorshipPolicyConfig} EvmErc4337WalletSponsorshipPolicyConfig */
/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletNativeCoinsConfig} EvmErc4337WalletNativeCoinsConfig */

/**
 * @typedef {Object} BridgeOptions
 * @property {string} targetChain - The identifier of the destination blockchain (e.g., "arbitrum", "selendra").
 * @property {string} recipient - The address of the recipient.
 * @property {string} token - The address of the token to bridge.
 * @property {number | bigint} amount - The amount of tokens to bridge to the destination chain (in base unit).
 * @property {string} [oftContractAddress] - Custom OFT contract address to use instead of auto-resolving from the source chain.
 * @property {number} [dstEid] - Custom LayerZero destination endpoint ID to override the default for the target chain.
 */

/**
 * @typedef {Object} SelendraBridgeProtocolConfig
 * @property {'mainnet' | 'testnet'} [network] - The network to use (default: 'mainnet').
 * @property {number} [chainId] - The chain ID (default: 1961 for mainnet, 1953 for testnet).
 * @property {string} [oftContractAddress] - Custom OFT contract address for Selendra (overrides placeholder).
 * @property {string} [transactionValueHelper] - Custom TransactionValueHelper address for ERC-4337 (overrides placeholder).
 * @property {number} [dstEid] - Custom LayerZero endpoint ID for Selendra (overrides placeholder).
 */

/**
 * Usdt0ProtocolSelendra provides USDT0 token bridging between Selendra and other EVM chains via LayerZero.
 *
 * **IMPORTANT:** For USDT0 bridging to work on Selendra, the following contracts must be deployed on-chain:
 * - OFT contract for USDT0
 * - LayerZero endpoint configuration
 * - TransactionValueHelper (for ERC-4337 support)
 *
 * These contracts do not exist yet on Selendra. The module is structurally complete and ready for use
 * once the contracts are deployed. Contract addresses can be injected via config.
 *
 * @extends BridgeProtocol
 *
 * @example
 * import Usdt0ProtocolSelendra from '@selendra/wdk-protocol-bridge-usdt0-selendra'
 * import WalletManagerSelendra from '@selendra/wdk-wallet-selendra'
 *
 * const wallet = new WalletManagerSelendra(seedPhrase)
 * const account = await wallet.getAccount(0)
 *
 * // Once contracts are deployed, provide them via config:
 * const bridgeProtocol = new Usdt0ProtocolSelendra(account, {
 *   oftContractAddress: '0x...', // Deployed OFT contract
 *   transactionValueHelper: '0x...', // Deployed helper for ERC-4337
 *   dstEid: 30100 // Assigned LayerZero endpoint ID
 * })
 *
 * const quote = await bridgeProtocol.quoteBridge({
 *   targetChain: 'ethereum',
 *   recipient: '0x...',
 *   token: '0x...',
 *   amount: '1000000'
 * })
 */
export default class Usdt0ProtocolSelendra extends BridgeProtocol {
  /**
   * Creates a new interface to the usdt0 protocol for Selendra.
   *
   * @overload
   * @param {WalletAccountReadOnlyEvm | WalletAccountReadOnlyEvmErc4337} account - The wallet account to use to interact with the protocol.
   * @param {SelendraBridgeProtocolConfig & BridgeProtocolConfig} [config] - The bridge protocol configuration.
   */

  /**
   * Creates a new interface to the usdt0 protocol for Selendra.
   *
   * @overload
   * @param {WalletAccountEvm | WalletAccountEvmErc4337} account - The wallet account to use to interact with the protocol.
   * @param {SelendraBridgeProtocolConfig & BridgeProtocolConfig} [config] - The bridge protocol configuration.
   */
  constructor (account, config = {}) {
    super(account, config)

    /**
     * The resolved chain configuration.
     *
     * @protected
     * @type {Object}
     */
    this._selendraChainConfig = SELENDRA_MAINNET
    if (config.network === 'testnet' || config.chainId === SELENDRA_TESTNET.chainId) {
      this._selendraChainConfig = SELENDRA_TESTNET
    }

    /**
     * Custom contract addresses from config.
     *
     * @protected
     * @type {{ oftContractAddress?: string, transactionValueHelper?: string, dstEid?: number }}
     */
    this._customAddresses = {
      oftContractAddress: config.oftContractAddress,
      transactionValueHelper: config.transactionValueHelper,
      dstEid: config.dstEid
    }

    /** @private */
    this._chainId = undefined

    if (account._config.provider) {
      const { provider } = account._config

      /** @private */
      this._provider = typeof provider === 'string'
        ? new JsonRpcProvider(provider, Network.from(this._selendraChainConfig.chainId), {
          staticNetwork: true,
          batchMaxCount: 0
        })
        : new BrowserProvider(provider)
    }
  }

  /**
   * Bridges a token to a different blockchain.
   *
   * Users must first approve the necessary amount of tokens to the usdt0 protocol using the {@link WalletAccountEvm#approve} or the {@link WalletAccountEvmErc4337#approve} method.
   *
   * @param {BridgeOptions} options - The bridge's options. Optionally pass 'oftContractAddress' to use a custom OFT contract address instead of the auto-resolved one, and/or 'dstEid' to
   *   override the destination endpoint id.
   * @param {Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig> & Pick<BridgeProtocolConfig, 'bridgeMaxFee'>} [config] - If
   *   the protocol has been initialized with an erc-4337 wallet account, it can be used to override its configuration options along with the 'bridgeMaxFee' option.
   * @returns {Promise<BridgeResult>} The bridge's result.
   */
  async bridge (options, config) {
    if (!(this._account instanceof WalletAccountEvm) && !(this._account instanceof WalletAccountEvmErc4337)) {
      throw new Error("The 'bridge(options)' method requires the protocol to be initialized with a non read-only account.")
    }

    if (!this._provider) {
      throw new Error('The wallet must be connected to a provider in order to perform bridge operations.')
    }

    const { oftTx, bridgeFee } = await this._getBridgeTransactions({ ...options, amount: BigInt(options.amount) })

    if (this._account instanceof WalletAccountEvmErc4337) {
      const { bridgeMaxFee } = { ...this._config, ...config }

      const { fee } = await this._account.quoteSendTransaction([oftTx], config)

      if (bridgeMaxFee !== undefined && fee + bridgeFee >= bridgeMaxFee) {
        throw new Error('Exceeded maximum fee cost for bridge operation.')
      }

      const { hash } = await this._account.sendTransaction([oftTx], config)

      return { hash, fee, bridgeFee }
    }

    const { fee } = await this._account.quoteSendTransaction(oftTx)

    if (this._config.bridgeMaxFee !== undefined && fee + bridgeFee >= this._config.bridgeMaxFee) {
      throw new Error('Exceeded maximum fee cost for bridge operation.')
    }

    const { hash } = await this._account.sendTransaction(oftTx)

    return { hash, fee, bridgeFee }
  }

  /**
   * Quotes the costs of a bridge operation.
   *
   * Users must first approve the necessary amount of tokens to the usdt0 protocol using the {@link WalletAccountEvm#approve} or the {@link WalletAccountEvmErc4337#approve} method.
   *
   * @param {BridgeOptions} options - The bridge's options. Optionally pass 'oftContractAddress' to use a custom OFT contract address instead of the auto-resolved one, and/or 'dstEid' to
   *   override the destination endpoint id.
   * @param {Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig>} [config] - If the protocol has been initialized with
   *   an erc-4337 wallet account, it can be used to override its configuration options.
   * @returns {Promise<Omit<BridgeResult, 'hash'>>} The bridge's quotes.
   */
  async quoteBridge (options, config) {
    if (!this._provider) {
      throw new Error('The wallet must be connected to a provider in order to quote bridge operations.')
    }

    const { oftTx, bridgeFee } = await this._getBridgeTransactions({ ...options, amount: BigInt(options.amount) })

    if (this._account instanceof WalletAccountReadOnlyEvmErc4337) {
      const { fee } = await this._account.quoteSendTransaction([oftTx], config)

      return { fee, bridgeFee }
    }

    const { fee } = await this._account.quoteSendTransaction(oftTx)

    return { fee, bridgeFee }
  }

  /**
   * Returns the mainnet configuration.
   *
   * @static
   * @returns {typeof SELENDRA_MAINNET} The mainnet configuration.
   */
  static getMainnetConfig () {
    return SELENDRA_MAINNET
  }

  /**
   * Returns the testnet configuration.
   *
   * @static
   * @returns {typeof SELENDRA_TESTNET} The testnet configuration.
   */
  static getTestnetConfig () {
    return SELENDRA_TESTNET
  }

  /** @private */
  async _getChainId () {
    if (!this._chainId) {
      this._chainId = this._selendraChainConfig.chainId
    }

    return this._chainId
  }

  /** @private */
  async _getBridgeTransactions ({ targetChain, recipient, token, amount, oftContractAddress, dstEid }) {
    const address = await this._account.getAddress()

    let oftContract

    if (oftContractAddress) {
      oftContract = new Contract(oftContractAddress, OFT_ABI, this._provider)
    } else {
      oftContract = await this._getOftContract(targetChain, token)
    }

    if (!oftContract) {
      throw new Error(`Token '${token}' not supported on this chain.`)
    }

    const sendParam = this._buildOftSendParam(targetChain, recipient, amount, dstEid)

    if (this._account instanceof WalletAccountEvmErc4337) {
      const transactionValueHelper = await this._getTransactionValueHelperContract()

      const { nativeFee, lzTokenFee } = await oftContract.quoteSend(sendParam, false)

      const bridgeFee = await transactionValueHelper.quoteSend(sendParam, [nativeFee, lzTokenFee])

      const fee = { nativeFee, lzTokenFee: 0 }

      const oftTx = {
        to: transactionValueHelper.target,
        value: 0,
        data: transactionValueHelper.interface.encodeFunctionData('send', [oftContract.target, sendParam, fee])
      }

      return { oftTx, bridgeFee }
    }

    const { nativeFee: bridgeFee } = await oftContract.quoteSend(sendParam, false)

    const fee = { nativeFee: bridgeFee, lzTokenFee: 0 }

    const oftTx = {
      to: oftContract.target,
      value: bridgeFee,
      data: oftContract.interface.encodeFunctionData('send', [sendParam, fee, address])
    }

    return { oftTx, bridgeFee }
  }

  /** @private */
  async _getOftContract (targetChain, token) {
    const blockchainKey = this._selendraChainConfig.chainId === 1961 ? 'selendra' : 'selendraTestnet'

    // Use custom address if provided, otherwise check config
    const selendraConfig = {
      chainId: this._selendraChainConfig.chainId,
      oftContract: this._customAddresses.oftContractAddress || BLOCKCHAINS[blockchainKey]?.oftContract,
      transactionValueHelper: this._customAddresses.transactionValueHelper || BLOCKCHAINS[blockchainKey]?.transactionValueHelper,
      eid: this._customAddresses.dstEid || BLOCKCHAINS[blockchainKey]?.eid
    }

    if (!selendraConfig.oftContract) {
      throw new Error(`USDT0 OFT contract not deployed on ${this._selendraChainConfig.name}. Please provide 'oftContractAddress' in config.`)
    }

    // Verify token matches
    const contract = new Contract(selendraConfig.oftContract, OFT_ABI, this._provider)
    const contractToken = await contract.token()

    if (contractToken.toLowerCase() !== token.toLowerCase()) {
      throw new Error(`Token '${token}' does not match the deployed OFT contract.`)
    }

    return contract
  }

  /** @private */
  _buildOftSendParam (targetChain, recipient, amount, dstEidOverride) {
    const options = Options.newOptions()

    let to

    if (targetChain === 'ton') {
      to = '0x' + Address.parse(recipient).toRawString().slice(2)
    } else if (targetChain === 'tron') {
      to = addressToBytes32('0x' + TronWeb.address.toHex(recipient))
    } else if (targetChain === 'solana') {
      to = zeroPadValue(toBeHex(decodeBase58(recipient)), 32)
    } else {
      to = addressToBytes32(recipient)
    }

    const targetChainConfig = BLOCKCHAINS[targetChain]
    const targetEid = dstEidOverride ?? targetChainConfig?.eid

    if (!targetEid) {
      throw new Error(`LayerZero endpoint ID not configured for target chain '${targetChain}'. Please provide 'dstEid' in options.`)
    }

    return {
      dstEid: targetEid,
      to,
      amountLD: amount,
      minAmountLD: amount * FEE_TOLERANCE / 1_000n,
      extraOptions: options.toBytes(),
      composeMsg: getBytes('0x'),
      oftCmd: getBytes('0x')
    }
  }

  /** @private */
  async _getTransactionValueHelperContract () {
    const blockchainKey = this._selendraChainConfig.chainId === 1961 ? 'selendra' : 'selendraTestnet'
    const transactionValueHelperAddress = this._customAddresses.transactionValueHelper || BLOCKCHAINS[blockchainKey]?.transactionValueHelper

    if (!transactionValueHelperAddress) {
      throw new Error(`TransactionValueHelper contract not deployed on ${this._selendraChainConfig.name} for ERC-4337 support. Please provide 'transactionValueHelper' in config.`)
    }

    const contract = new Contract(transactionValueHelperAddress, TRANSACTION_VALUE_HELPER_ABI, this._provider)

    return contract
  }
}
