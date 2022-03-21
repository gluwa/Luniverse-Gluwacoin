require('dotenv').config({path:__dirname+'/.env.development'});
require('@nomiclabs/hardhat-waffle');
// require('solidity-coverage');
require('@nomiclabs/hardhat-ethers');
require('@openzeppelin/hardhat-upgrades');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = { 
  solidity: {
    version: "0.8.12",
    settings: {
      optimizer: {
        runs:20,
        enabled: true
      },
      evmVersion: "istanbul"
    }
  },
  mocha: {
    timeout: 2000000
  },
  networks: {
    hardhat: {},
    kaleido: {
      url: `https://${process.env.RPC_KALEIDO_USER}:${process.env.RPC_KALEIDO_PASS}@${process.env.RPC_KALEIDO_ENDPOINT}`,
      chainId: 1245549440,
      gas: 0,
      accounts: [`${process.env.KALEIDO_PRIVATEKEY}`]
    },
    ropsten: {
      url: `${process.env.RPC_ROPSTEN}`,
      chainId: 3,
      gase: "auto",
      accounts: [`${process.env.KALEIDO_PRIVATEKEY}`]
    },
    rinkeby: {
      url: `${process.env.RPC_RINKEBY}`,
      chainId: 4,
      gase: "auto",
      accounts: [`${process.env.KALEIDO_PRIVATEKEY}`]
    },
    kovan: {
      url: `${process.env.RPC_KOVAN}`,
      chainId: 42,
      gase: "auto",
      accounts: [`${process.env.KALEIDO_PRIVATEKEY}`]
    },
    polygon: {
      url: process.env.RPC_POLYGONMAINNET,
      chainId: 137,
      gase: "auto",
      accounts: [`${process.env.KALEIDO_PRIVATEKEY}`]
    },
    mumbai: {
      url: process.env.RPC_POLYGONMUMBAI,
      chainId: 80001,
      gase: "auto",
      accounts: [`${process.env.KALEIDO_PRIVATEKEY}`]
    },
  }
};