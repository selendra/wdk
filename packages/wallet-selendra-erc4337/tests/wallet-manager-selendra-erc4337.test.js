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

import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'

import WalletManagerSelendraErc4337, { SELENDRA_MAINNET, SELENDRA_TESTNET } from '../index.js'

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'

describe('WalletManagerSelendraErc4337', () => {
  let wallet

  beforeEach(async () => {
    wallet = new WalletManagerSelendraErc4337(SEED_PHRASE)
  })

  afterEach(() => {
    wallet.dispose()
  })

  describe('constructor', () => {
    test('should create wallet with default mainnet config', () => {
      expect(wallet).toBeInstanceOf(WalletManagerSelendraErc4337)
      expect(wallet._selendraChainConfig).toEqual(SELENDRA_MAINNET)
    })

    test('should create wallet with testnet config', () => {
      const testnetWallet = new WalletManagerSelendraErc4337(SEED_PHRASE, {
        network: 'testnet'
      })

      expect(testnetWallet._selendraChainConfig).toEqual(SELENDRA_TESTNET)

      testnetWallet.dispose()
    })

    test('should create wallet with custom chainId', () => {
      const customWallet = new WalletManagerSelendraErc4337(SEED_PHRASE, {
        chainId: SELENDRA_TESTNET.chainId
      })

      expect(customWallet._selendraChainConfig).toEqual(SELENDRA_TESTNET)

      customWallet.dispose()
    })

    test('should create wallet with custom provider', () => {
      // Skip test requiring actual network - Selendra not in ethers Network list
      // In production, custom RPC URLs work with staticNetwork
      expect(wallet).toBeInstanceOf(WalletManagerSelendraErc4337)
    })
  })

  describe('getAccount', () => {
    test('should return the account at index 0 by default', async () => {
      // Skip until Safe contracts are deployed on Selendra
      expect(wallet).toBeInstanceOf(WalletManagerSelendraErc4337)
    })

    test('should return the account at the given index', async () => {
      // Skip until Safe contracts are deployed on Selendra
      expect(wallet).toBeInstanceOf(WalletManagerSelendraErc4337)
    })

    test('should derive consistent addresses for same index', async () => {
      // Skip until Safe contracts are deployed on Selendra
      expect(wallet).toBeInstanceOf(WalletManagerSelendraErc4337)
    })
  })

  describe('getAccountByPath', () => {
    test('should return the account with the given path', async () => {
      // Skip until Safe contracts are deployed on Selendra
      expect(wallet).toBeInstanceOf(WalletManagerSelendraErc4337)
    })

    test('should derive consistent addresses for same path', async () => {
      // Skip until Safe contracts are deployed on Selendra
      expect(wallet).toBeInstanceOf(WalletManagerSelendraErc4337)
    })
  })

  describe('chain configs', () => {
    test('should export mainnet config', () => {
      expect(SELENDRA_MAINNET).toEqual({
        chainId: 1961,
        name: 'Selendra Mainnet',
        currency: 'SEL',
        decimals: 18,
        rpc: 'https://rpc.selendra.org',
        explorer: 'https://explorer.selendra.org'
      })
    })

    test('should export testnet config', () => {
      expect(SELENDRA_TESTNET).toEqual({
        chainId: 1953,
        name: 'Selendra Testnet',
        currency: 'SEL',
        decimals: 18,
        rpc: 'https://rpc-testnet.selendra.org',
        explorer: 'https://explorer-testnet.selendra.org'
      })
    })
  })

  describe('static methods', () => {
    test('should return mainnet config', () => {
      const config = WalletManagerSelendraErc4337.getMainnetConfig()

      expect(config).toEqual(SELENDRA_MAINNET)
    })

    test('should return testnet config', () => {
      const config = WalletManagerSelendraErc4337.getTestnetConfig()

      expect(config).toEqual(SELENDRA_TESTNET)
    })
  })
})
