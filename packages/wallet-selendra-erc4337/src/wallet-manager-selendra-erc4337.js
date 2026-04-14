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

import WalletManager from '@tetherto/wdk-wallet'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'

import { JsonRpcProvider, Network as EthersNetwork } from 'ethers'

import WalletAccountSelendraErc4337 from './wallet-account-selendra-erc4337.js'

import { SELENDRA_MAINNET, SELENDRA_TESTNET } from './chains.js'

/** @typedef {import('ethers').Provider} Provider */

/** @typedef {import('@tetherto/wdk-wallet-evm').FeeRates} FeeRates */

/**
 * @typedef {Object} SelendraErc4337WalletConfig
 * @property {string | import('ethers').Eip1193Provider} [provider] - The URL of the RPC provider, or an EIP-1193 provider instance.
 * @property {number} [chainId] - The chain ID (default: 1961 for mainnet, 1953 for testnet).
 * @property {number | bigint} [transferMaxFee] - The maximum fee amount for transfer operations.
 * @property {'mainnet' | 'testnet'} [network] - The network to use (default: 'mainnet').
 * @property {'0.2.0' | '0.3.0'} [safeModulesVersion] - The Safe modules version (default: '0.3.0').
 * @property {string} [entryPointAddress] - The ERC-4337 EntryPoint v0.7 contract address.
 * @property {string} [bundlerUrl] - The bundler service URL.
 * @property {string} [paymasterUrl] - The paymaster service URL.
 * @property {string} [paymasterAddress] - The paymaster contract address.
 * @property {{ address: string }} [paymasterToken] - ERC-20 token for paymaster fees.
 * @property {boolean} [isSponsored] - Enable sponsored transaction mode.
 * @property {string} [sponsorshipPolicyId] - The sponsorship policy ID.
 * @property {boolean} [useNativeCoins] - Use native coins for fees.
 */

/**
 * @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletConfig} EvmErc4337WalletConfig
 */

/**
 * WalletManagerSelendraErc4337 provides ERC-4337 account abstraction wallet management for the Selendra blockchain.
 *
 * ERC-4337 enables smart contract wallets and gasless transactions via paymasters.
 * This class extends the base ERC-4337 functionality with Selendra-specific configuration.
 *
 * **IMPORTANT:** For ERC-4337 to work on Selendra, the following contracts must be deployed:
 * - Safe4337Module contract
 * - EntryPoint v0.7 contract
 * - Paymaster contract (VerifyingPaymaster or similar)
 *
 * These contracts do not exist yet on Selendra mainnet/testnet. The module is structurally complete
 * and ready for use once the contracts are deployed. Contract addresses can be injected via config.
 *
 * @extends WalletManager
 *
 * @example
 * import WalletManagerSelendraErc4337 from '@selendra/wdk-wallet-selendra-erc4337'
 *
 * // Once contracts are deployed:
 * const wallet = new WalletManagerSelendraErc4337(seedPhrase, {
 *   entryPointAddress: '0x...',
 *   bundlerUrl: 'https://bundler.selendra.org',
 *   paymasterUrl: 'https://paymaster.selendra.org',
 *   paymasterAddress: '0x...',
 *   paymasterToken: { address: '0x...' }
 * })
 *
 * @example
 * // Testnet
 * const wallet = new WalletManagerSelendraErc4337(seedPhrase, { network: 'testnet' })
 */
export default class WalletManagerSelendraErc4337 extends WalletManager {
  /**
   * Creates a new ERC-4337 wallet manager for the Selendra blockchain.
   *
   * @param {string | Uint8Array} seed - The wallet's BIP-39 seed phrase.
   * @param {SelendraErc4337WalletConfig} [config] - The configuration object.
   */
  constructor (seed, config = {}) {
    // Resolve the chain config based on network or chainId
    const chainConfig = config.network === 'testnet' || config.chainId === SELENDRA_TESTNET.chainId
      ? SELENDRA_TESTNET
      : SELENDRA_MAINNET

    // Merge chainId into config for parent class
    const mergedConfig = {
      ...config,
      chainId: chainConfig.chainId
    }

    super(seed, mergedConfig)

    /**
     * The resolved chain configuration.
     *
     * @protected
     * @type {Object}
     */
    this._selendraChainConfig = chainConfig

    /**
     * The original user config.
     *
     * @protected
     * @type {SelendraErc4337WalletConfig}
     */
    this._config = mergedConfig

    // Replace the provider with one that has the correct Selendra chain ID.
    // The parent class may create a provider, but ethers v6 may detect the wrong chain ID.
    // We force the correct one using Network.from() and staticNetwork: true.
    const selendraNetwork = EthersNetwork.from(chainConfig.chainId)
    this._provider = new JsonRpcProvider(chainConfig.rpc, selendraNetwork, {
      staticNetwork: true,
      batchMaxCount: 0
    })
  }

  /**
   * Returns the wallet account at a specific index (see BIP-44).
   *
   * @param {number} [index] - The index of the account to get (default: 0).
   * @returns {Promise<import('./wallet-account-selendra-erc4337.js').default>} The account.
   */
  async getAccount (index = 0) {
    const account = await this.getAccountByPath(`0'/0/${index}`)

    // Re-connect the account to our corrected provider with the right chain ID
    if (account._account) {
      account._account = account._account.connect(this._provider)
    }

    return account
  }

  /**
   * Returns the wallet account at a specific BIP-44 derivation path.
   *
   * @param {string} path - The derivation path (e.g. "0'/0/0").
   * @returns {Promise<import('./wallet-account-selendra-erc4337.js').default>} The account.
   */
  async getAccountByPath (path) {
    if (!this._accounts[path]) {
      const account = new WalletAccountSelendraErc4337(this.seed, path, this._config, this._selendraChainConfig, this._provider)

      this._accounts[path] = account
    }

    const account = this._accounts[path]

    // Re-connect the account to our corrected provider with the right chain ID
    if (account._account) {
      account._account = account._account.connect(this._provider)
    }

    return account
  }

  /**
   * Returns the current fee rates.
   *
   * @returns {Promise<FeeRates>} The fee rates (in weis).
   */
  async getFeeRates () {
    if (!this._provider) {
      throw new Error('The wallet must be connected to a provider to get fee rates.')
    }

    const data = await this._provider.getFeeData()

    const feeRate = data.maxFeePerGas || data.gasPrice

    return {
      normal: feeRate * WalletManagerEvm._FEE_RATE_NORMAL_MULTIPLIER / 100n,
      fast: feeRate * WalletManagerEvm._FEE_RATE_FAST_MULTIPLIER / 100n
    }
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
}
