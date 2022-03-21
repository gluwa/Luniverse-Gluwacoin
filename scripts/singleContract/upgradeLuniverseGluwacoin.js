const hre = require('hardhat');
const ScriptHelper = require('../shared');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.network;

  console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);
  console.log('\x1b[32m%s\x1b[0m', "Upgrading LuniverseGluwacoin contracts with the account: ", deployer.address);

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

  const UpgradeableLuniverseGluwacoin_Address = await ScriptHelper.retrieveContractFromResultToJson(network.name, 'UpgradeableLuniverseGluwacoin');
  
  // Can't get the upgradeProxy() to work on any network else than local
  // const UpgradeableLuniverseGluwacoin = await hre.ethers.getContractFactory("LuniverseGluwacoin");
  // const upgradeableLuniverseGluwacoin = await hre.upgrades.upgradeProxy(UpgradeableLuniverseGluwacoin_Address, UpgradeableLuniverseGluwacoin);

  // Get ProxyAdmin address from .openzeppelin/
  const ProxyAdmin_Address = await ScriptHelper.retrieveProxyAdminContractAddress(hre.network.config.chainId);
  console.log("Deployed using Proxy Admin contract address: ", ProxyAdmin_Address);
  await ScriptHelper.exportResultToJson('ProxyAdmin', ProxyAdmin_Address, network.name, deployer.address);
  
  // Logic Contract Deployed
  const LuniverseGluwacoin = await hre.ethers.getContractFactory("LuniverseGluwacoin");
  const controlledLuniverseGluwacoin = await LuniverseGluwacoin.deploy();
  // Upgrade
  await ScriptHelper.upgradeContract(controlledLuniverseGluwacoin.address, UpgradeableLuniverseGluwacoin_Address, ProxyAdmin_Address, deployer, hre.ethers);

  // Get Logic/Implementation address from proxy admin contract
  const LogicSandboxLuniverseGluwacoin = await ScriptHelper.getImplementation(UpgradeableLuniverseGluwacoin_Address, ProxyAdmin_Address, deployer, hre.ethers);
  console.log("Deployed using Logic/Implementation contract address: ", LogicSandboxLuniverseGluwacoin);
  await ScriptHelper.exportResultToJson('LogicSandboxLuniverseGluwacoin', LogicSandboxLuniverseGluwacoin, network.name, deployer.address);

  await ScriptHelper.exportResultToJson('UpgradeableLuniverseGluwacoin', UpgradeableLuniverseGluwacoin_Address, network.name, deployer.address);
  console.log('\x1b[32m%s\x1b[0m', "UpgradeableLuniverseGluwacoin upgraded at address: ", UpgradeableLuniverseGluwacoin_Address);
}
  
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});