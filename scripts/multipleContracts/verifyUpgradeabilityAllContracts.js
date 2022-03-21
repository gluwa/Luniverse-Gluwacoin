const { ethers } = require('hardhat');
const hre = require('hardhat');
const ScriptHelper = require('../shared');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.network;
  let delayBetweenDeployment = 2000;
  if (network.name === 'hardhat') {

  console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);

  if (network.name === 'hardhat') {
    console.log('\x1b[33m%s\x1b[0m', 'Since you are on local, we need to deploy the contract before upgrading it!')

    // Contract deployed with transparent proxy
    const UpgradeableLuniverseGluwacoin = await hre.ethers.getContractFactory("LuniverseGluwacoin");
    const upgradeableLuniverseGluwacoin = await hre.upgrades.deployProxy(UpgradeableLuniverseGluwacoin, [ScriptHelper.name, ScriptHelper.symbol, ScriptHelper.decimals]);
    await upgradeableLuniverseGluwacoin.deployed();

    await ScriptHelper.exportResultToJson('UpgradeableLuniverseGluwacoin', upgradeableLuniverseGluwacoin.address, network.name, deployer.address);
    console.log('\x1b[32m%s\x1b[0m', "UpgradeableLuniverseGluwacoin deployed at address: ", upgradeableLuniverseGluwacoin.address);

    // Wait before next deployment
    await ScriptHelper.delay(delayBetweenDeployment);

    // Contract deployed with transparent proxy
    const UpgradeableSandboxLuniverseGluwacoin = await hre.ethers.getContractFactory("SandboxLuniverseGluwacoin");
    const upgradeableSandboxLuniverseGluwacoin = await hre.upgrades.deployProxy(UpgradeableSandboxLuniverseGluwacoin, [ScriptHelper.name, ScriptHelper.symbol, ScriptHelper.decimals]);
    await upgradeableSandboxLuniverseGluwacoin.deployed();

    await ScriptHelper.exportResultToJson('UpgradeableSandboxLuniverseGluwacoin', upgradeableSandboxLuniverseGluwacoin.address, network.name, deployer.address);
    console.log('\x1b[32m%s\x1b[0m', "UpgradeableSandboxLuniverseGluwacoin deployed at address: ", upgradeableSandboxLuniverseGluwacoin.address);
    console.log(' ')
  }

  // UpgradeableLuniverseGluwacoin
  const UpgradeableLuniverseGluwacoin_Address = await ScriptHelper.retrieveContractFromResultToJson(network.name, 'UpgradeableLuniverseGluwacoin');

  const UpgradeableLuniverseGluwacoin = await hre.ethers.getContractFactory("LuniverseGluwacoin");
  const upgradeableLuniverseGluwacoin = await hre.upgrades.upgradeProxy(UpgradeableLuniverseGluwacoin_Address, UpgradeableLuniverseGluwacoin);

  // Get ProxyAdmin address from .openzeppelin/
  const ProxyAdmin_Address = await ScriptHelper.retrieveProxyAdminContractAddress(hre.network.config.chainId);
  console.log("Deployed using Proxy Admin contract address: ", ProxyAdmin_Address);
  await ScriptHelper.exportResultToJson('ProxyAdmin', ProxyAdmin_Address, network.name, deployer.address);

  // Get Logic/Implementation address from proxy admin contract
  const LogicSandboxLuniverseGluwacoin = await ScriptHelper.getImplementation(upgradeableLuniverseGluwacoin.address, ProxyAdmin_Address, deployer, hre.ethers);
  console.log("Deployed using Logic/Implementation contract address: ", LogicSandboxLuniverseGluwacoin);
  await ScriptHelper.exportResultToJson('LogicSandboxLuniverseGluwacoin', LogicSandboxLuniverseGluwacoin, network.name, deployer.address);

  await ScriptHelper.exportResultToJson('UpgradeableLuniverseGluwacoin', upgradeableLuniverseGluwacoin.address, network.name, deployer.address);
  console.log('\x1b[32m%s\x1b[0m', "UpgradeableLuniverseGluwacoin upgraded at address: ", upgradeableLuniverseGluwacoin.address);

  // Wait before next deployment
  await ScriptHelper.delay(delayBetweenDeployment);
  console.log(' ')

  // UpgradeableSandboxLuniverseGluwacoin
  const UpgradeableSandboxLuniverseGluwacoin_Address = await ScriptHelper.retrieveContractFromResultToJson(network.name, 'UpgradeableSandboxLuniverseGluwacoin');

  const UpgradeableSandboxLuniverseGluwacoin = await hre.ethers.getContractFactory("SandboxLuniverseGluwacoin");
  const upgradeableSandboxLuniverseGluwacoin = await hre.upgrades.upgradeProxy(UpgradeableSandboxLuniverseGluwacoin_Address, UpgradeableSandboxLuniverseGluwacoin);

  console.log("Deployed using Proxy Admin contract address: ", ProxyAdmin_Address);

  // Get Logic/Implementation address from proxy admin contract
  const LogicSandboxSandboxLuniverseGluwacoin = await ScriptHelper.getImplementation(upgradeableSandboxLuniverseGluwacoin.address, ProxyAdmin_Address, deployer, hre.ethers);
  console.log("Deployed using Logic/Implementation contract address: ", LogicSandboxSandboxLuniverseGluwacoin);
  await ScriptHelper.exportResultToJson('LogicSandboxSandboxLuniverseGluwacoin', LogicSandboxSandboxLuniverseGluwacoin, network.name, deployer.address);

  await ScriptHelper.exportResultToJson('UpgradeableSandboxLuniverseGluwacoin', upgradeableSandboxLuniverseGluwacoin.address, network.name, deployer.address);
  console.log('\x1b[32m%s\x1b[0m', "UpgradeableSandboxLuniverseGluwacoin upgraded at address: ", upgradeableSandboxLuniverseGluwacoin.address);
  
  } else {
    console.log('\x1b[33m%s\x1b[0m', 'This script is only available on local network at the moment, upgradeProxy() seams to bug on all other network.')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});