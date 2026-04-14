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

import WalletManagerEvm from '@tetherto/wdk-wallet-evm'

import { JsonRpcProvider, Network as EthersNetwork } from 'ethers'

import { SELENDRA_MAINNET, SELENDRA_TESTNET } from './chains.js'

/** @typedef {import('@tetherto/wdk-wallet-evm').WalletAccountEvm} WalletAccountEvm */
/** @typedef {import('@tetherto/wdk-wallet-evm').EvmWalletConfig} EvmWalletConfig */

/**
 * @typedef {Object} SelendraWalletConfig
 * @property {string | import('ethers').Eip1193Provider} [provider] - The URL of the RPC provider, or an EIP-1193 provider instance.
 * @property {number} [chainId] - The chain ID (default: 1961 for mainnet, 1953 for testnet).
 * @property {number | bigint} [transferMaxFee] - The maximum fee amount for transfer operations.
 * @property {'mainnet' | 'testnet'} [network] - The network to use (default: 'mainnet').
 */

/**
 * WalletManagerSelendra provides wallet management for the Selendra blockchain.
 *
 * Selendra is a Substrate-based blockchain with EVM compatibility.
 * This class extends WalletManagerEvm with Selendra-specific defaults
 * including correct chain ID (1961) and RPC endpoints.
 *
 * @extends WalletManagerEvm
 *
 * @example
 * import WalletManagerSelendra from '@selendra/wdk-wallet-selendra'
 *
 * const wallet = new WalletManagerSelendra(seedPhrase)
 * const account = await wallet.getAccount(0)
 * console.log('Address:', await account.getAddress())
 * console.log('Balance:', await account.getBalance())
 *
 * @example
 * // Testnet
 * const wallet = new WalletManagerSelendra(seedPhrase, { network: 'testnet' })
 *
 * @example
 * // Custom RPC
 * const wallet = new WalletManagerSelendra(seedPhrase, { provider: 'https://my-rpc.selendra.org' })
 */
export default class WalletManagerSelendra extends WalletManagerEvm {
  /**
   * Creates a new wallet manager for the Selendra blockchain.
   *
   * @param {string | Uint8Array} seed - The wallet's BIP-39 seed phrase.
   * @param {SelendraWalletConfig} [config] - The configuration object.
   */
  constructor (seed, config = {}) {
    const { network, chainId, ...restConfig } = config

    // Resolve the chain config based on network or chainId
    let chainConfig = SELENDRA_MAINNET
    if (network === 'testnet' || chainId === SELENDRA_TESTNET.chainId) {
      chainConfig = SELENDRA_TESTNET
    }

    // Pass RPC URL as string so parent creates a JsonRpcProvider
    const providerConfig = restConfig.provider || chainConfig.rpc

    super(seed, {
      ...restConfig,
      provider: providerConfig
    })

    /**
     * The resolved chain configuration.
     *
     * @protected
     * @type {Object}
     */
    this._selendraChainConfig = chainConfig

    /**
     * The original user config (without provider override).
     *
     * @protected
     * @type {SelendraWalletConfig}
     */
    this._userConfig = config

    // Replace the provider with one that has the correct Selendra chain ID.
    // The parent WalletManagerEvm creates a JsonRpcProvider from the string URL,
    // but ethers v6 may detect the wrong chain ID. We force the correct one.
    const selendraNetwork = EthersNetwork.from(chainConfig.chainId)
    this._provider = new JsonRpcProvider(chainConfig.rpc, selendraNetwork, {
      staticNetwork: true,
      batchMaxCount: 0
    })
  }

  /**
   * Returns the wallet account at a specific index.
   *
   * @param {number} [index] - The account index (default: 0).
   * @returns {Promise<WalletAccountEvm>} The account.
   */
  async getAccount (index = 0) {
    const account = await super.getAccount(index)

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
   * @returns {Promise<WalletAccountEvm>} The account.
   */
  async getAccountByPath (path) {
    const account = await super.getAccountByPath(path)

    // Re-connect the account to our corrected provider
    if (account._account) {
      account._account = account._account.connect(this._provider)
    }

    return account
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
