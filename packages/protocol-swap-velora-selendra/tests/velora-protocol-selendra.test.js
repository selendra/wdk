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

import { describe, expect, test } from '@jest/globals'

import VeloraProtocolSelendra, { SELENDRA_MAINNET, SELENDRA_TESTNET } from '../index.js'

describe('VeloraProtocolSelendra', () => {
  describe('constructor', () => {
    test('should create protocol with default mainnet config', () => {
      const mockAccount = {
        _config: { provider: 'https://rpc.selendra.org' }
      }
      const protocol = new VeloraProtocolSelendra(mockAccount)

      expect(protocol).toBeInstanceOf(VeloraProtocolSelendra)
      expect(protocol._selendraChainConfig).toEqual(SELENDRA_MAINNET)
    })

    test('should create protocol with testnet config', () => {
      const mockAccount = {
        _config: { provider: 'https://rpc-testnet.selendra.org' }
      }
      const testnetProtocol = new VeloraProtocolSelendra(mockAccount, {
        network: 'testnet'
      })

      expect(testnetProtocol._selendraChainConfig).toEqual(SELENDRA_TESTNET)
    })

    test('should create protocol with custom chainId', () => {
      const mockAccount = {
        _config: { provider: 'https://rpc-testnet.selendra.org' }
      }
      const customProtocol = new VeloraProtocolSelendra(mockAccount, {
        chainId: SELENDRA_TESTNET.chainId
      })

      expect(customProtocol._selendraChainConfig).toEqual(SELENDRA_TESTNET)
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
      const config = VeloraProtocolSelendra.getMainnetConfig()

      expect(config).toEqual(SELENDRA_MAINNET)
    })

    test('should return testnet config', () => {
      const config = VeloraProtocolSelendra.getTestnetConfig()

      expect(config).toEqual(SELENDRA_TESTNET)
    })
  })
})
