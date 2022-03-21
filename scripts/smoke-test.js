const { ethers } = require('hardhat');
const hre = require('hardhat');
const ScriptHelper = require('../shared');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.network;
  let delayBetweenDeployment = 2000;
  if (network.name === 'kaleido') {
    delayBetweenDeployment = 5000;
  }

  console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);

  if (network.name === 'hardhat') {
    console.log('\x1b[33m%s\x1b[0m', 'Since you are on local, we need to deploy the contract before upgrading it!')

    // Contract deployed with transparent proxy
    const UpgradeableLuniverseGluwacoin = await hre.ethers.getContractFactory("LuniverseGluwacoin");
    const upgradeableLuniverseGluwacoin = await hre.upgrades.deployProxy(UpgradeableLuniverseGluwacoin, [ScriptHelper.name, ScriptHelper.symbol, ScriptHelper.decimals]);
    await upgradeableLuniverseGluwacoin.deployed();

    await ScriptHelper.exportResultToJson('UpgradeableLuniverseGluwacoin', upgradeableLuniverseGluwacoin.address, network.name, deployer.address);
    console.log('\x1b[32m%s\x1b[0m', "UpgradeableLuniverseGluwacoin deployed at address: ", upgradeableLuniverseGluwacoin.address);
    console.log(' ')
  }
  let peg = [];

  for(let i = 1; 1 < 6; i++) {
    peg.push(ScriptHelper.smokeTestSandboxPeg(amount, upgradeableLuniverseGluwacoin, deployer, ethers));
  }
  console.log('peg', peg);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});