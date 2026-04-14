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

/**
 * Selendra mainnet configuration.
 *
 * @constant {Object}
 * @property {number} chainId - The chain ID (1961).
 * @property {string} name - The network name.
 * @property {string} currency - The native currency symbol (SEL).
 * @property {number} decimals - The number of decimals for the native currency.
 * @property {string} rpc - The default RPC URL.
 * @property {string} explorer - The block explorer URL.
 */
export const SELENDRA_MAINNET = {
  chainId: 1961,
  name: 'Selendra Mainnet',
  currency: 'SEL',
  decimals: 18,
  rpc: 'https://rpc.selendra.org',
  explorer: 'https://explorer.selendra.org'
}

/**
 * Selendra testnet configuration.
 *
 * @constant {Object}
 * @property {number} chainId - The chain ID (1953).
 * @property {string} name - The network name.
 * @property {string} currency - The native currency symbol (SEL).
 * @property {number} decimals - The number of decimals for the native currency.
 * @property {string} rpc - The default RPC URL.
 * @property {string} explorer - The block explorer URL.
 */
export const SELENDRA_TESTNET = {
  chainId: 1953,
  name: 'Selendra Testnet',
  currency: 'SEL',
  decimals: 18,
  rpc: 'https://rpc-testnet.selendra.org',
  explorer: 'https://explorer-testnet.selendra.org'
}
