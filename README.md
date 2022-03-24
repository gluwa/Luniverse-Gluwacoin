[![license](https://img.shields.io/github/license/jamesisaac/react-native-background-task.svg)](https://opensource.org/licenses/MIT)

# Luniverse Gluwacoin

Implementation of Sidechain Gluwacoin for [Luniverse](https://luniverse.io/)

Read [Sidechain Gluwacoin](Sidechain%20Gluwacoin.md) for details.

## What is Gluwacoin?

Gluwacoin is an interoperable stablecoin standard. The standard has built-in functions to enable exchange with other cryptocurrencies, which connects its ecosystem to other blockchains. We have implemented the system to support the ERC20 standard on the Ethereum network. The implementation includes security features, compliance features, and upgrade features that provide the desired level of security and elasticity.

The Gluwacoin Trust proposed the standard. This repository is the official implementations of the Gluwacoin standard by Gluwa.

For more information, see [Gluwacoin](/Gluwacoin.md), [gluwacoin.com](https://gluwacoin.com), or the [original whitepaper](https://gluwacoin.com/white-paper).

---

## Setup

### Installing Dependencies

```commandline
$ npm install
```

#### Use the CLI User Interface for deployment and testing
```commandline
$ npm run cli
```

#### Deploy and run tests on local testnet

Let’s deploy and test Prize Linked Account contract to our development network.

```commandline
$ npx hardhat test
```
More Hardhat documentation

https://hardhat.org/getting-started/
