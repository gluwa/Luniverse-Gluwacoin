var fs = require('fs');
const abi = require('../test/upgradeability/abi');

const name = 'LuniverseGluwacoin';
const symbol = 'LG';
const decimals = 18;

  const retrieveProxyAdminContractAddress = (chainId) => {
    let fileName = `unknown-${chainId}`;
    if (chainId === 1)
      fileName = 'mainnet';
    if (chainId === 3)
      fileName = 'ropsten';
    if (chainId === 4)
      fileName = 'rinkeby';
    let returnContractAddress = '';
    const openZeppelinFilePath = `.openzeppelin/${fileName}.json`;
    if (fs.existsSync(openZeppelinFilePath)) {
      const rawdata = fs.readFileSync(openZeppelinFilePath);
      proxyContractsAddressDeployed = JSON.parse(rawdata);
      returnContractAddress = proxyContractsAddressDeployed.admin.address;
    }
  return returnContractAddress;
}

const getImplementation = async (transparentProxyAddres, proxyAdminAddress, owner, ethers) => {
  const ProxyAdmin = await new ethers.Contract(proxyAdminAddress, abi.ProxyAdmin, owner);
  return await ProxyAdmin.getProxyImplementation(transparentProxyAddres);
}

async function upgradeContract(implement, transparentProxyAddres, proxyAdminAddress, owner,ethers) {
  const ProxyAdmin = await new ethers.Contract(proxyAdminAddress, abi.ProxyAdmin, owner);
  await ProxyAdmin.upgrade(transparentProxyAddres, implement, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
  console.log('\x1b[32m%s\x1b[0m', `
  .d8888b.  .d88888b. 888b    888888888888888888888b.        d8888 .d8888b.88888888888888     8888888888b. 8888888b.        d88888888888888888888888888888888b.  
  d88P  Y88bd88P" "Y88b8888b   888    888    888   Y88b      d88888d88P  Y88b   888    888     888888   Y88b888  "Y88b      d88888    888    888       888  "Y88b 
  888    888888     88888888b  888    888    888    888     d88P888888    888   888    888     888888    888888    888     d88P888    888    888       888    888 
  888       888     888888Y88b 888    888    888   d88P    d88P 888888          888    888     888888   d88P888    888    d88P 888    888    8888888   888    888 
  888       888     888888 Y88b888    888    8888888P"    d88P  888888          888    888     8888888888P" 888    888   d88P  888    888    888       888    888 
  888    888888     888888  Y88888    888    888 T88b    d88P   888888    888   888    888     888888       888    888  d88P   888    888    888       888    888 
  Y88b  d88PY88b. .d88P888   Y8888    888    888  T88b  d8888888888Y88b  d88P   888    Y88b. .d88P888       888  .d88P d8888888888    888    888       888  .d88P 
   "Y8888P"  "Y88888P" 888    Y888    888    888   T88bd88P     888 "Y8888P"    888     "Y88888P" 888       8888888P" d88P     888    888    88888888888888888P"  
  `);
  contract =  await new ethers.Contract(transparentProxyAddres, abi.Token, owner);
  return contract;
}

const smokeTestSandboxPeg = async (amount, transparentProxyAddres, owner, ethers) => {
  const randHashOwner = await ethers.utils.randomBytes(32)
  const contract = await new ethers.Contract(transparentProxyAddres, abi.SandboxToken, owner);
  return await contract.peg(randHashOwner, amount, owner.address);
}

const exportResultToJson = (contractName, contractAddress, deployedNetwork, deployedBy) => {
  const contractsAddressDeployedFile = 'contractsAddressDeployed.json';
  const contractsAddressDeployedHistoryFile = 'contractsAddressDeployedHistory.json';
  let contractsAddressDeployed = [];
  let contractsAddressDeployedHistory = [];
  let addressModify = false;
  
  // Add or edit contract address if deploy on same network
  if (fs.existsSync(contractsAddressDeployedFile)) {
    const rawdata = fs.readFileSync(contractsAddressDeployedFile);
    contractsAddressDeployed = JSON.parse(rawdata);
    if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
      contractsAddressDeployed
        .filter((c) => c.name === contractName && c.network === deployedNetwork)
        .map((c) => {
          addressModify = true;
          return {
            name: c.name,
            address: contractAddress,
            network: deployedNetwork,
            deployer: deployedBy,
            deploymentDate: new Date().toISOString()
          }
        });
    }
    if (!addressModify) {
      contractsAddressDeployed.push({
        name: contractName,
        address: contractAddress,
        network: deployedNetwork,
        deployer: deployedBy,
        deploymentDate: new Date().toISOString()
      });
    }
    fs.unlinkSync(contractsAddressDeployedFile);
  } else {
    contractsAddressDeployed.push({
      name: contractName,
      address: contractAddress,
      network: deployedNetwork,
      deployer: deployedBy,
      deploymentDate: new Date().toISOString()
    });
  }
  fs.writeFileSync(contractsAddressDeployedFile, JSON.stringify(contractsAddressDeployed, null, 2), 'utf-8', (err) => {
    if (err)
      console.log('Error writing address to file: ', err);
    });

  // Log all contracts deployed
  if (fs.existsSync(contractsAddressDeployedHistoryFile)) {
    const rawdata = fs.readFileSync(contractsAddressDeployedHistoryFile);
    contractsAddressDeployedHistory = JSON.parse(rawdata);
    contractsAddressDeployedHistory.push({
      name: contractName,
      address: contractAddress,
      network: deployedNetwork,
      deployer: deployedBy,
      deploymentDate: new Date().toISOString()
    });
    fs.unlinkSync(contractsAddressDeployedHistoryFile);
  } else {
    contractsAddressDeployedHistory.push({
      name: contractName,
      address: contractAddress,
      network: deployedNetwork,
      deployer: deployedBy,
      deploymentDate: new Date().toISOString()
    });
  }
  fs.writeFileSync(contractsAddressDeployedHistoryFile, JSON.stringify(contractsAddressDeployedHistory, null, 2), 'utf-8', (err) => {
    if (err)
      console.log('Error writing address to file: ', err);
    });
}


const retrieveContractFromResultToJson = (deployedNetwork, contractName) => {
  const contractsAddressDeployedFile = 'contractsAddressDeployed.json';
  let returnContractAddress = '';
  if (fs.existsSync(contractsAddressDeployedFile)) {
    const rawdata = fs.readFileSync(contractsAddressDeployedFile);
    contractsAddressDeployed = JSON.parse(rawdata);
    if (contractsAddressDeployed !== undefined && contractsAddressDeployed.length > 0) {
      returnContractAddress = contractsAddressDeployed.filter((c) => c.name === contractName && c.network === deployedNetwork)[0].address;
    }
  }
  return returnContractAddress;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  name,
  symbol,
  decimals,
  retrieveProxyAdminContractAddress,
  getImplementation,
  upgradeContract,
  smokeTestSandboxPeg,
  exportResultToJson,
  retrieveContractFromResultToJson,
  delay
}