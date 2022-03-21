const hre = require('hardhat');
const ScriptHelper = require('../shared');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.network;

  console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);
  console.log('\x1b[32m%s\x1b[0m', "Upgrading SandboxLuniverseGluwacoin contracts with the account: ", deployer.address);

  if (network.name === 'hardhat') {
    console.log('\x1b[33m%s\x1b[0m', 'Since you are on local, we need to deploy the contract before upgrading it!')

    // Contract deployed with transparent proxy
    const UpgradeableSandboxLuniverseGluwacoin = await hre.ethers.getContractFactory("SandboxLuniverseGluwacoin");
    const upgradeableSandboxLuniverseGluwacoin = await hre.upgrades.deployProxy(UpgradeableSandboxLuniverseGluwacoin, [ScriptHelper.name, ScriptHelper.symbol, ScriptHelper.decimals]);
    await upgradeableSandboxLuniverseGluwacoin.deployed();

    await ScriptHelper.exportResultToJson('UpgradeableSandboxLuniverseGluwacoin', upgradeableSandboxLuniverseGluwacoin.address, network.name, deployer.address);
    console.log('\x1b[32m%s\x1b[0m', "UpgradeableSandboxLuniverseGluwacoin deployed at address: ", upgradeableSandboxLuniverseGluwacoin.address);
    console.log(' ')
  }

  const UpgradeableSandboxLuniverseGluwacoin_Address = await ScriptHelper.retrieveContractFromResultToJson(network.name, 'UpgradeableSandboxLuniverseGluwacoin');
  
  // Can't get the upgradeProxy() to work on any network else than local
  // const UpgradeableSandboxLuniverseGluwacoin = await hre.ethers.getContractFactory("SandboxLuniverseGluwacoin");
  // const upgradeableSandboxLuniverseGluwacoin = await hre.upgrades.upgradeProxy(UpgradeableSandboxLuniverseGluwacoin_Address, UpgradeableSandboxLuniverseGluwacoin);

  // Get ProxyAdmin address from .openzeppelin/
  const ProxyAdmin_Address = await ScriptHelper.retrieveProxyAdminContractAddress(hre.network.config.chainId);
  console.log("Deployed using Proxy Admin contract address: ", ProxyAdmin_Address);
  await ScriptHelper.exportResultToJson('ProxyAdmin', ProxyAdmin_Address, network.name, deployer.address);
  
  // Logic Contract Deployed
  const SandboxLuniverseGluwacoin = await hre.ethers.getContractFactory("SandboxLuniverseGluwacoin");
  const sandboxLuniverseGluwacoin = await SandboxLuniverseGluwacoin.deploy();
  // Upgrade
  await ScriptHelper.upgradeContract(sandboxLuniverseGluwacoin.address, UpgradeableSandboxLuniverseGluwacoin_Address, ProxyAdmin_Address, deployer, hre.ethers);

  // Get Logic/Implementation address from proxy admin contract
  const LogicSandboxLuniverseGluwacoin = await ScriptHelper.getImplementation(UpgradeableSandboxLuniverseGluwacoin_Address, ProxyAdmin_Address, deployer, hre.ethers);
  console.log("Deployed using Logic/Implementation contract address: ", LogicSandboxLuniverseGluwacoin);
  await ScriptHelper.exportResultToJson('LogicSandboxLuniverseGluwacoin', LogicSandboxLuniverseGluwacoin, network.name, deployer.address);

  await ScriptHelper.exportResultToJson('UpgradeableSandboxLuniverseGluwacoin', UpgradeableSandboxLuniverseGluwacoin_Address, network.name, deployer.address);
  console.log('\x1b[32m%s\x1b[0m', "UpgradeableSandboxLuniverseGluwacoin upgraded at address: ", UpgradeableSandboxLuniverseGluwacoin_Address);
}
  
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});