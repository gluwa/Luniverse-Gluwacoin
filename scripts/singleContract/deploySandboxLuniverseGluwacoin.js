const hre = require('hardhat');
const ScriptHelper = require('../shared');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.network
  
  console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);
  console.log('\x1b[32m%s\x1b[0m', "Deploying SandboxLuniverseGluwacoin contracts with the account: ", deployer.address);

  // Contract deployed with transparent proxy
  const UpgradeableSandboxLuniverseGluwacoin = await hre.ethers.getContractFactory("SandboxLuniverseGluwacoin");
  const upgradeableSandboxLuniverseGluwacoin = await hre.upgrades.deployProxy(UpgradeableSandboxLuniverseGluwacoin, [ScriptHelper.name, ScriptHelper.symbol, ScriptHelper.decimals]);
  await upgradeableSandboxLuniverseGluwacoin.deployed();

  // Get ProxyAdmin address from .openzeppelin/
  const ProxyAdmin_Address = await ScriptHelper.retrieveProxyAdminContractAddress(hre.network.config.chainId);
  console.log("Deployed using Proxy Admin contract address: ", ProxyAdmin_Address);
  await ScriptHelper.exportResultToJson('ProxyAdmin', ProxyAdmin_Address, network.name, deployer.address);

  // Get Logic/Implementation address from proxy admin contract
  const LogicSandboxLuniverseGluwacoin = await ScriptHelper.getImplementation(upgradeableSandboxLuniverseGluwacoin.address, ProxyAdmin_Address, deployer, hre.ethers);
  console.log("Deployed using Logic/Implementation contract address: ", LogicSandboxLuniverseGluwacoin);
  await ScriptHelper.exportResultToJson('LogicSandboxLuniverseGluwacoin', LogicSandboxLuniverseGluwacoin, network.name, deployer.address);

  await ScriptHelper.exportResultToJson('UpgradeableSandboxLuniverseGluwacoin', upgradeableSandboxLuniverseGluwacoin.address, network.name, deployer.address);
  console.log('\x1b[32m%s\x1b[0m', "UpgradeableSandboxLuniverseGluwacoin deployed at address: ", upgradeableSandboxLuniverseGluwacoin.address);
}
  
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});