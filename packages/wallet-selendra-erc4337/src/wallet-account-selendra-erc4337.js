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

import { WalletAccountEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337'

/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletConfig} EvmErc4337WalletConfig */

/**
 * WalletAccountSelendraErc4337 is the ERC-4337 account abstraction wallet account for Selendra.
 *
 * This class extends the base ERC-4337 account with Selendra-specific provider handling
 * to ensure correct chain ID detection.
 *
 * @extends WalletAccountEvmErc4337
 */
export default class WalletAccountSelendraErc4337 extends WalletAccountEvmErc4337 {
  /**
   * Creates a new Selendra ERC-4337 wallet account.
   *
   * @param {string | Uint8Array} seed - The wallet's BIP-39 seed phrase.
   * @param {string} path - The BIP-44 derivation path (e.g. "0'/0/0").
   * @param {EvmErc4337WalletConfig} config - The configuration object.
   * @param {Object} chainConfig - The Selendra chain configuration.
   * @param {import('ethers').Provider} [provider] - The corrected provider with proper chain ID.
   */
  constructor (seed, path, config, chainConfig, provider) {
    super(seed, path, config)

    /**
     * The Selendra chain configuration.
     *
     * @protected
     * @type {Object}
     */
    this._selendraChainConfig = chainConfig

    /**
     * The corrected provider with proper chain ID.
     *
     * @protected
     * @type {import('ethers').Provider | undefined}
     */
    this._selendraProvider = provider

    // Re-connect the owner account to the corrected provider
    if (this._ownerAccount && this._selendraProvider) {
      this._ownerAccount._account = this._ownerAccount._account.connect(this._selendraProvider)
    }
  }

  /**
   * Returns the chain ID for this account.
   *
   * @returns {Promise<bigint>} The chain ID.
   */
  async getChainId () {
    return BigInt(this._selendraChainConfig.chainId)
  }
}
