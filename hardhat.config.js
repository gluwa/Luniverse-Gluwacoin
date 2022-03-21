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

let networkConfig = {
  hardhat: {},
}
// Kaleido
if(process.env.RPC_KALEIDO_USER && process.env.RPC_KALEIDO_PASS && process.env.KALEIDO_PRIVATEKEY) {
  networkConfig = {
    ...networkConfig,
    kaleido: {
      url: `https://${process.env.RPC_KALEIDO_USER}:${process.env.RPC_KALEIDO_PASS}@${process.env.RPC_KALEIDO_ENDPOINT}`,
      chainId: 1245549440,
      gas: 0,
      accounts: [`${process.env.KALEIDO_PRIVATEKEY}`]
    },
  }
}
// Ethereum Mainet
if(process.env.RPC_ETHMAINNET && process.env.ETHMAINNET_PRIVATEKEY) {
  networkConfig = {
    ...networkConfig,
    ethereum: {
      url: `${process.env.RPC_ETHMAINNET}`,
      chainId: 1,
      gase: "auto",
      accounts: [`${process.env.ETHMAINNET_PRIVATEKEY}`]
    },
  }
}
// Ethereum Ropsten
if(process.env.RPC_ROPSTEN && process.env.ROPSTEN_PRIVATEKEY) {
  networkConfig = {
    ...networkConfig,
    ropsten: {
      url: `${process.env.RPC_ROPSTEN}`,
      chainId: 3,
      gase: "auto",
      accounts: [`${process.env.ROPSTEN_PRIVATEKEY}`]
    },
  }
}
// Ethereum Rinkeby
if(process.env.RPC_RINKEBY && process.env.RINKEBY_PRIVATEKEY) {
  networkConfig = {
    ...networkConfig,
    rinkeby: {
      url: `${process.env.RPC_RINKEBY}`,
      chainId: 4,
      gase: "auto",
      accounts: [`${process.env.RINKEBY_PRIVATEKEY}`]
    },
  }
}
// Ethereum Kovan
if(process.env.KOVAN_PRIVATEKEY && process.env.RPC_KOVAN) {
  networkConfig = {
    ...networkConfig,
    kovan: {
      url: `${process.env.RPC_KOVAN}`,
      chainId: 42,
      gase: "auto",
      accounts: [`${process.env.KOVAN_PRIVATEKEY}`]
    },
  }
}
// Polygon Mainnet
if(process.env.POLYGONMAINNET_PRIVATEKEY && process.env.RPC_POLYGONMAINNET) {
  networkConfig = {
    ...networkConfig,
    polygon: {
      url: process.env.RPC_POLYGONMAINNET,
      chainId: 137,
      gase: "auto",
      accounts: [`${process.env.POLYGONMAINNET_PRIVATEKEY}`]
    },
  }
}
// Polygon Mumbai
if(process.env.POLYGONMUMBAI_PRIVATEKEY && process.env.RPC_POLYGONMUMBAI) {
  networkConfig = {
    ...networkConfig,
    mumbai: {
      url: process.env.RPC_POLYGONMUMBAI,
      chainId: 80001,
      gase: "auto",
      accounts: [`${process.env.POLYGONMUMBAI_PRIVATEKEY}`]
    },
  }
}


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
      }
    }
  },
  mocha: {
    timeout: 2000000
  },
  networks: networkConfig
};