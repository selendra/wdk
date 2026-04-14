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

import WalletManagerSelendra, { SELENDRA_MAINNET, SELENDRA_TESTNET } from '../index.js'

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'

describe('WalletManagerSelendra', () => {
  let wallet

  beforeEach(async () => {
    wallet = new WalletManagerSelendra(SEED_PHRASE)
  })

  afterEach(() => {
    wallet.dispose()
  })

  describe('constructor', () => {
    test('should create wallet with default mainnet config', () => {
      expect(wallet).toBeInstanceOf(WalletManagerSelendra)
    })

    test('should create wallet with custom provider', () => {
      const customWallet = new WalletManagerSelendra(SEED_PHRASE, {
        provider: 'https://rpc-testnet.selendra.org'
      })

      expect(customWallet).toBeInstanceOf(WalletManagerSelendra)

      customWallet.dispose()
    })

    test('should create wallet with custom chainId', () => {
      const customWallet = new WalletManagerSelendra(SEED_PHRASE, {
        chainId: SELENDRA_TESTNET.chainId,
        provider: SELENDRA_TESTNET.rpc
      })

      expect(customWallet).toBeInstanceOf(WalletManagerSelendra)

      customWallet.dispose()
    })
  })

  describe('getAccount', () => {
    test('should return the account at index 0 by default', async () => {
      const account = await wallet.getAccount()

      expect(account).toBeDefined()
      expect(account.path).toBe("m/44'/60'/0'/0/0")
    })

    test('should connect account with provider having correct chain ID', async () => {
      const account = await wallet.getAccount()

      // Verify the account's internal provider has the correct Selendra chain ID
      const providerChainId = await account._account.provider.getNetwork()
        .then(network => Number(network.chainId))

      expect(providerChainId).toBe(SELENDRA_MAINNET.chainId)
    })

    test('should return the account at the given index', async () => {
      const account = await wallet.getAccount(3)

      expect(account).toBeDefined()
      expect(account.path).toBe("m/44'/60'/0'/0/3")
    })

    test('should derive consistent addresses for same index', async () => {
      const account1 = await wallet.getAccount(0)
      const account2 = await wallet.getAccount(0)

      const address1 = await account1.getAddress()
      const address2 = await account2.getAddress()

      expect(address1).toBe(address2)
    })
  })

  describe('getAccountByPath', () => {
    test('should return the account with the given path', async () => {
      const account = await wallet.getAccountByPath("1'/2/3")

      expect(account).toBeDefined()
      expect(account.path).toBe("m/44'/60'/1'/2/3")
    })

    test('should derive consistent addresses for same path', async () => {
      const account1 = await wallet.getAccountByPath("0'/0/1")
      const account2 = await wallet.getAccountByPath("0'/0/1")

      const address1 = await account1.getAddress()
      const address2 = await account2.getAddress()

      expect(address1).toBe(address2)
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
      const config = WalletManagerSelendra.getMainnetConfig()

      expect(config).toEqual(SELENDRA_MAINNET)
    })

    test('should return testnet config', () => {
      const config = WalletManagerSelendra.getTestnetConfig()

      expect(config).toEqual(SELENDRA_TESTNET)
    })
  })
})
