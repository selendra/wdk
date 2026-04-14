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

import { SELENDRA_MAINNET, SELENDRA_TESTNET } from './chains.js'

/** @typedef {import('@tetherto/wdk-wallet-evm').WalletAccountEvm} WalletAccountEvm */
/** @typedef {import('@tetherto/wdk-wallet-evm').EvmWalletConfig} EvmWalletConfig */

/**
 * @typedef {Object} SelendraWalletConfig
 * @property {string | import('ethers').Eip1193Provider} [provider] - The URL of the RPC provider, or an EIP-1193 provider instance.
 * @property {number} [chainId] - The chain ID (default: 1961 for mainnet, 1953 for testnet).
 * @property {number | bigint} [transferMaxFee] - The maximum fee amount for transfer operations.
 */

/**
 * WalletManagerSelendra provides wallet management for the Selendra blockchain.
 *
 * Selendra is a Substrate-based blockchain with EVM compatibility.
 * This class extends WalletManagerEvm with Selendra-specific defaults.
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
 */
export default class WalletManagerSelendra extends WalletManagerEvm {
  /**
   * Creates a new wallet manager for the Selendra blockchain.
   *
   * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   * @param {SelendraWalletConfig} [config] - The configuration object.
   */
  constructor (seed, config = {}) {
    const { chainId, provider, ...restConfig } = config

    // Default to mainnet if no provider or chainId specified
    const defaultChainId = chainId ?? (provider ? undefined : SELENDRA_MAINNET.chainId)
    const defaultProvider = provider ?? (chainId ? undefined : SELENDRA_MAINNET.rpc)

    super(seed, {
      ...restConfig,
      provider: defaultProvider,
      chainId: defaultChainId
    })

    /**
     * The Selendra wallet configuration.
     *
     * @protected
     * @type {SelendraWalletConfig}
     */
    this._config = config
  }

  /**
   * Returns the wallet account at a specific index (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
   *
   * @example
   * // Returns the account with derivation path m/44'/60'/0'/0/1
   * const account = await wallet.getAccount(1);
   * @param {number} [index] - The index of the account to get (default: 0).
   * @returns {Promise<WalletAccountEvm>} The account.
   */
  async getAccount (index = 0) {
    return await super.getAccount(index)
  }

  /**
   * Returns the wallet account at a specific BIP-44 derivation path.
   *
   * @example
   * // Returns the account with derivation path m/44'/60'/0'/0/1
   * const account = await wallet.getAccountByPath("0'/0/1");
   * @param {string} path - The derivation path (e.g. "0'/0/0").
   * @returns {Promise<WalletAccountEvm>} The account.
   */
  async getAccountByPath (path) {
    return await super.getAccountByPath(path)
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
