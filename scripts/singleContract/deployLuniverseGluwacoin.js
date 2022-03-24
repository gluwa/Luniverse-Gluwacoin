const hre = require('hardhat');
const ScriptHelper = require('../shared');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.network;

  console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);
  console.log('\x1b[32m%s\x1b[0m', "Deploying LuniverseGluwacoin contracts with the account: ", deployer.address);

  // Contract deployed with transparent proxy
  const UpgradeableLuniverseGluwacoin = await hre.ethers.getContractFactory("LuniverseGluwacoin");
  const upgradeableLuniverseGluwacoin = await hre.upgrades.deployProxy(UpgradeableLuniverseGluwacoin, [ScriptHelper.name, ScriptHelper.symbol, ScriptHelper.decimals]);
  await upgradeableLuniverseGluwacoin.deployed();

  // Get ProxyAdmin address from .openzeppelin/
  const ProxyAdmin_Address = await ScriptHelper.retrieveProxyAdminContractAddress(hre.network.config.chainId);
  console.log("Deployed using Proxy Admin contract address: ", ProxyAdmin_Address);
  await ScriptHelper.exportResultToJson('ProxyAdmin', ProxyAdmin_Address, network.name, deployer.address);

  // Get Logic/Implementation address from proxy admin contract
  const LogicLuniverseGluwacoin = await ScriptHelper.getImplementation(upgradeableLuniverseGluwacoin.address, ProxyAdmin_Address, deployer, hre.ethers);
  console.log("Deployed using Logic/Implementation contract address: ", LogicLuniverseGluwacoin);
  await ScriptHelper.exportResultToJson('LogicLuniverseGluwacoin', LogicLuniverseGluwacoin, network.name, deployer.address);

  await ScriptHelper.exportResultToJson('UpgradeableLuniverseGluwacoin', upgradeableLuniverseGluwacoin.address, network.name, deployer.address);
  console.log('\x1b[32m%s\x1b[0m', "UpgradeableLuniverseGluwacoin deployed at address: ", upgradeableLuniverseGluwacoin.address);
}
  
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});