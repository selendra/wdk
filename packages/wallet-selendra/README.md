# @selendra/wdk-wallet-selendra

A simple and secure package to manage BIP-44 wallets for the Selendra blockchain. This package provides a clean API for creating, managing, and interacting with Selendra wallets using BIP-39 seed phrases and EVM-compatible derivation paths.

## About WDK

This module is part of the [**WDK (Wallet Development Kit)**](https://docs.wdk.tether.io/) project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control.

## About Selendra

Selendra is a Substrate-based blockchain with full EVM compatibility, enabling developers to run Ethereum smart contracts while leveraging Substrate's performance and flexibility.

- **Network**: Selendra Mainnet
- **Chain ID**: 1961 (0x7A9)
- **Currency**: SEL
- **RPC**: https://rpc.selendra.org
- **Explorer**: https://explorer.selendra.org

## Installation

```bash
npm install @selendra/wdk-wallet-selendra
```

## Quick Start

```javascript
import WalletManagerSelendra from '@selendra/wdk-wallet-selendra'

const seedPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

const wallet = new WalletManagerSelendra(seedPhrase)

const account = await wallet.getAccount(0)
const address = await account.getAddress()
console.log('Address:', address)

wallet.dispose()
```

## Usage with WDK

```javascript
import WDK from '@tetherto/wdk'
import WalletManagerSelendra from '@selendra/wdk-wallet-selendra'

const wdk = new WDK(seed)
  .registerWallet('selendra', WalletManagerSelendra)

const account = await wdk.getAccount('selendra', 0)
console.log('Address:', await account.getAddress())
console.log('Balance:', await account.getBalance())
```

## Configuration

### Mainnet (Default)

```javascript
const wallet = new WalletManagerSelendra(seedPhrase)
// Uses: https://rpc.selendra.org
// Chain ID: 1961
```

### Testnet

```javascript
import WalletManagerSelendra, { SELENDRA_TESTNET } from '@selendra/wdk-wallet-selendra'

const wallet = new WalletManagerSelendra(seedPhrase, {
  provider: SELENDRA_TESTNET.rpc,
  chainId: SELENDRA_TESTNET.chainId
})
```

### Custom RPC

```javascript
const wallet = new WalletManagerSelendra(seedPhrase, {
  provider: 'https://your-custom-rpc.com'
})
```

## Chain Configurations

Access predefined chain configurations:

```javascript
import { SELENDRA_MAINNET, SELENDRA_TESTNET } from '@selendra/wdk-wallet-selendra'

// Or via static methods
const mainnet = WalletManagerSelendra.getMainnetConfig()
const testnet = WalletManagerSelendra.getTestnetConfig()
```

## Key Capabilities

- **BIP-39 Seed Phrase Support**: Generate and validate mnemonic seed phrases
- **BIP-44 Derivation Paths**: Standard Ethereum derivation (m/44'/60')
- **Multi-Account Management**: Derive multiple accounts from a single seed phrase
- **EIP-1559 Transaction Support**: Modern fee estimation and transaction sending
- **ERC-20 Token Support**: Query balances and transfer tokens
- **Message Signing**: Sign and verify messages (EIP-191 and EIP-712)
- **Fee Estimation**: Real-time network fee rates with normal/fast tiers
- **Secure Memory Disposal**: Clear private keys from memory when done

## API Reference

### WalletManagerSelendra

Extends `WalletManagerEvm` from `@tetherto/wdk-wallet-evm`.

#### Constructor

```javascript
new WalletManagerSelendra(seed, config)
```

- `seed` (string | Uint8Array): BIP-39 seed phrase
- `config` (Object, optional):
  - `provider` (string | Eip1193Provider): RPC URL or EIP-1193 provider
  - `chainId` (number): Chain ID
  - `transferMaxFee` (number | bigint): Maximum fee for transfers

#### Methods

- `getAccount(index?)`: Returns account at index
- `getAccountByPath(path)`: Returns account at derivation path
- `getFeeRates()`: Returns current fee rates
- `getMainnetConfig()`: Static - returns mainnet configuration
- `getTestnetConfig()`: Static - returns testnet configuration
- `dispose()`: Clears sensitive data from memory

## Examples

### Check Balance

```javascript
const account = await wallet.getAccount(0)
const balance = await account.getBalance()
console.log('Balance:', balance.toString(), 'wei')
```

### Get Token Balance

```javascript
const tokenAddress = '0x...'
const balance = await account.getTokenBalance(tokenAddress)
console.log('Token Balance:', balance.toString())
```

### Send Transaction

```javascript
const { hash, fee } = await account.sendTransaction({
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  value: 1000000000000000n // 0.001 SEL
})
console.log('Tx Hash:', hash)
console.log('Fee:', fee.toString(), 'wei')
```

### Sign Message

```javascript
const message = 'Hello, Selendra!'
const signature = await account.sign(message)
console.log('Signature:', signature)
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
