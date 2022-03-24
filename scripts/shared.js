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

const missingEnvVariables = () => {
  let errorMissingEnv = [];
  // Kaleido
  let kaleido = 'Kaleido';
  if(
    process.env.RPC_KALEIDO_USER === undefined || process.env.RPC_KALEIDO_USER === "" || 
    process.env.RPC_KALEIDO_PASS === undefined || process.env.RPC_KALEIDO_PASS === "" || 
    process.env.RPC_KALEIDO_ENDPOINT === undefined || process.env.RPC_KALEIDO_ENDPOINT === "" || 
    process.env.KALEIDO_PRIVATEKEY === undefined || process.env.KALEIDO_PRIVATEKEY === ""
  ) {
    let kaleidoPrivateKeycEnv = 'OK';
    let kaleidoRpcEnv = 'OK';
    if(process.env.KALEIDO_PRIVATEKEY === undefined || process.env.KALEIDO_PRIVATEKEY === "") {
        kaleidoPrivateKeycEnv = 'Missing'
    }
    if(
        process.env.RPC_KALEIDO_USER === undefined || process.env.RPC_KALEIDO_USER === "" || 
        process.env.RPC_KALEIDO_PASS === undefined || process.env.RPC_KALEIDO_PASS === "" || 
        process.env.RPC_KALEIDO_ENDPOINT === undefined || process.env.RPC_KALEIDO_ENDPOINT === ""
    ) {
        kaleidoRpcEnv = 'Missing'
    }
    errorMissingEnv.push({
      Network: kaleido,
      PrivateKey: kaleidoPrivateKeycEnv,
      RPC: kaleidoRpcEnv
    })
    kaleido = {
      name: kaleido,
      disabled: 'Setup environment variables first!'
    };
  }
  // Ethereum Mainet
  let ethMainnet = 'Ethereum Mainet';
  if(
    process.env.RPC_ETHMAINNET === undefined || process.env.RPC_ETHMAINNET === "" || 
    process.env.ETHMAINNET_PRIVATEKEY === undefined || process.env.ETHMAINNET_PRIVATEKEY === ""
  ) {
    let kaleidoPrivateKeycEnv = 'OK';
    let kaleidoRpcEnv = 'OK';
    if(process.env.ETHMAINNET_PRIVATEKEY === undefined || process.env.ETHMAINNET_PRIVATEKEY === "") {
      kaleidoPrivateKeycEnv = 'Missing'
    }
    if(process.env.RPC_ETHMAINNET === undefined || process.env.RPC_ETHMAINNET === "") {
      kaleidoRpcEnv = 'Missing'
    }
          
    errorMissingEnv.push({
      Network: ethMainnet,
      PrivateKey: kaleidoRpcEnv,
      RPC: kaleidoPrivateKeycEnv
    })
    ethMainnet = {
      name: ethMainnet,
      disabled: 'Setup environment variables first!'
    };
  }
  // Ethereum Ropsten
  let ropsten = 'Ethereum Ropsten';
  if(
    process.env.RPC_ROPSTEN === undefined || process.env.RPC_ROPSTEN === "" || 
    process.env.ROPSTEN_PRIVATEKEY === undefined || process.env.ROPSTEN_PRIVATEKEY === ""
  ) {
    let kaleidoPrivateKeycEnv = 'OK';
    let kaleidoRpcEnv = 'OK';
    if(process.env.ROPSTEN_PRIVATEKEY === undefined || process.env.ROPSTEN_PRIVATEKEY === "") {
      kaleidoPrivateKeycEnv = 'Missing'
    }
    if(process.env.RPC_ROPSTEN === undefined || process.env.RPC_ROPSTEN === "") {
      kaleidoRpcEnv = 'Missing'
    }
        
    errorMissingEnv.push({
      Network: ropsten,
      PrivateKey: kaleidoRpcEnv,
      RPC: kaleidoPrivateKeycEnv
    })
    ropsten = {
      name: ropsten,
      disabled: 'Setup environment variables first!'
    };
  }
  // Ethereum Rinkeby
  let rinkeby = 'Ethereum Rinkeby';
  if(
    process.env.RPC_RINKEBY === undefined || process.env.RPC_RINKEBY === "" || 
    process.env.RINKEBY_PRIVATEKEY === undefined || process.env.RINKEBY_PRIVATEKEY === ""
  ) {
    let kaleidoPrivateKeycEnv = 'OK';
    let kaleidoRpcEnv = 'OK';
    if(process.env.RINKEBY_PRIVATEKEY === undefined || process.env.RINKEBY_PRIVATEKEY === "") {
      kaleidoPrivateKeycEnv = 'Missing'
    }
    if(process.env.RPC_RINKEBY === undefined || process.env.RPC_RINKEBY === "") {
      kaleidoRpcEnv = 'Missing'
    }
        
    errorMissingEnv.push({
      Network: rinkeby,
      PrivateKey: kaleidoRpcEnv,
      RPC: kaleidoPrivateKeycEnv
    })
    rinkeby = {
      name: rinkeby,
      disabled: 'Setup environment variables first!'
    };
  }
  // Ethereum Kovan
  let kovan = 'Ethereum Kovan';
  if(
    process.env.KOVAN_PRIVATEKEY === undefined || process.env.KOVAN_PRIVATEKEY === "" || 
    process.env.RPC_KOVAN === undefined || process.env.RPC_KOVAN === ""
  ) {
    let kaleidoPrivateKeycEnv = 'OK';
    let kaleidoRpcEnv = 'OK';
    if(process.env.RPC_KOVAN === undefined || process.env.RPC_KOVAN === "") {
      kaleidoPrivateKeycEnv = 'Missing'
    }
    if(process.env.KOVAN_PRIVATEKEY === undefined || process.env.KOVAN_PRIVATEKEY === "") {
      kaleidoRpcEnv = 'Missing'
    }
        
    errorMissingEnv.push({
      Network: kovan,
      PrivateKey: kaleidoRpcEnv,
      RPC: kaleidoPrivateKeycEnv
    })
    kovan = {
      name: kovan,
      disabled: 'Setup environment variables first!'
    };
  }
  // Polygon Mainnet
  let polygon = 'Polygon Mainnet';
  if(
    process.env.KOVAN_PRIVATEKEY === undefined || process.env.KOVAN_PRIVATEKEY === "" || 
    process.env.RPC_KOVAN === undefined || process.env.RPC_KOVAN === ""
  ) {
    let kaleidoPrivateKeycEnv = 'OK';
    let kaleidoRpcEnv = 'OK';
    if(process.env.RPC_KOVAN === undefined || process.env.RPC_KOVAN === "") {
      kaleidoPrivateKeycEnv = 'Missing'
    }
    if(process.env.KOVAN_PRIVATEKEY === undefined || process.env.KOVAN_PRIVATEKEY === "") {
      kaleidoRpcEnv = 'Missing'
    }
        
    errorMissingEnv.push({
      Network: polygon,
      PrivateKey: kaleidoRpcEnv,
      RPC: kaleidoPrivateKeycEnv
    })
    polygon = {
      name: polygon,
      disabled: 'Setup environment variables first!'
    };
  }
  // Polygon Mumbai
  let mumbai = 'Polygon Mumbai';
  if(
    process.env.KOVAN_PRIVATEKEY === undefined || process.env.KOVAN_PRIVATEKEY === "" || 
    process.env.RPC_KOVAN === undefined || process.env.RPC_KOVAN === ""
  ) {
    let kaleidoPrivateKeycEnv = 'OK';
    let kaleidoRpcEnv = 'OK';
    if(process.env.RPC_KOVAN === undefined || process.env.RPC_KOVAN === "") {
      kaleidoPrivateKeycEnv = 'Missing'
    }
    if(process.env.KOVAN_PRIVATEKEY === undefined || process.env.KOVAN_PRIVATEKEY === "") {
      kaleidoRpcEnv = 'Missing'
    }
        
    errorMissingEnv.push({
      Network: mumbai,
      PrivateKey: kaleidoRpcEnv,
      RPC: kaleidoPrivateKeycEnv
    })
    mumbai = {
      name: mumbai,
      disabled: 'Setup environment variables first!'
    };
  }

  if(errorMissingEnv.length > 0) {
    console.log('\x1b[33m%s\x1b[0m', 'Error: Missing environment variables!');
    console.log('\x1b[33m%s\x1b[0m', 'To run test, deploy or upgrade on other network than local, you will need first to setup your RPC and/or private key!');
    console.log('\x1b[33m%s\x1b[0m', 'Environment variables missing:');
    console.table(errorMissingEnv);
  }
  return { kaleido, ethMainnet, ropsten, rinkeby, kovan, polygon, mumbai }
}

const delay = ms => new Promise(res => setTimeout(res, ms));

const writeEnvFile = (allEnv) => {
  const RPC_ETHMAINNET = allEnv.RPC_ETHMAINNET !== "" ? allEnv.RPC_ETHMAINNET : ""
  const ETHMAINNET_PRIVATEKEY = allEnv.ETHMAINNET_PRIVATEKEY !== "" ? allEnv.ETHMAINNET_PRIVATEKEY : ""
  const RPC_ROPSTEN = allEnv.RPC_ROPSTEN !== "" ? allEnv.RPC_ROPSTEN : ""
  const ROPSTEN_PRIVATEKEY = allEnv.ROPSTEN_PRIVATEKEY !== "" ? allEnv.ROPSTEN_PRIVATEKEY : ""
  const RPC_RINKEBY = allEnv.RPC_RINKEBY !== "" ? allEnv.RPC_RINKEBY : ""
  const RINKEBY_PRIVATEKEY = allEnv.RINKEBY_PRIVATEKEY !== "" ? allEnv.RINKEBY_PRIVATEKEY : ""
  const RPC_KOVAN = allEnv.RPC_KOVAN !== "" ? allEnv.RPC_KOVAN : ""
  const KOVAN_PRIVATEKEY = allEnv.KOVAN_PRIVATEKEY !== "" ? allEnv.KOVAN_PRIVATEKEY : ""
  const RPC_POLYGONMAINNET = allEnv.RPC_POLYGONMAINNET !== "" ? allEnv.RPC_POLYGONMAINNET : "https://polygon-rpc.com"
  const POLYGONMAINNET_PRIVATEKEY = allEnv.POLYGONMAINNET_PRIVATEKEY !== "" ? allEnv.POLYGONMAINNET_PRIVATEKEY : ""
  const RPC_POLYGONMUMBAI = allEnv.RPC_POLYGONMUMBAI !== "" ? allEnv.RPC_POLYGONMUMBAI : "https://rpc-mumbai.maticvigil.com"
  const POLYGONMUMBAI_PRIVATEKEY = allEnv.POLYGONMUMBAI_PRIVATEKEY !== "" ? allEnv.POLYGONMUMBAI_PRIVATEKEY : ""
  const RPC_KALEIDO_USER = allEnv.RPC_KALEIDO_USER !== "" ? allEnv.RPC_KALEIDO_USER : ""
  const RPC_KALEIDO_PASS = allEnv.RPC_KALEIDO_PASS !== "" ? allEnv.RPC_KALEIDO_PASS : ""
  const RPC_KALEIDO_ENDPOINT = allEnv.RPC_KALEIDO_ENDPOINT !== "" ? allEnv.RPC_KALEIDO_ENDPOINT : ""
  const KALEIDO_PRIVATEKEY = allEnv.KALEIDO_PRIVATEKEY !== "" ? allEnv.KALEIDO_PRIVATEKEY : ""

  fs.writeFileSync('.env.development', `RPC_ETHMAINNET = "${RPC_ETHMAINNET}"
ETHMAINNET_PRIVATEKEY = "${ETHMAINNET_PRIVATEKEY}"

RPC_ROPSTEN = "${RPC_ROPSTEN}"
ROPSTEN_PRIVATEKEY = "${ROPSTEN_PRIVATEKEY}"

RPC_RINKEBY = "${RPC_RINKEBY}"
RINKEBY_PRIVATEKEY = "${RINKEBY_PRIVATEKEY}"

RPC_KOVAN = "${RPC_KOVAN}"
KOVAN_PRIVATEKEY = "${KOVAN_PRIVATEKEY}"

RPC_POLYGONMAINNET = "${RPC_POLYGONMAINNET}"
POLYGONMAINNET_PRIVATEKEY = "${POLYGONMAINNET_PRIVATEKEY}"

RPC_POLYGONMUMBAI = "${RPC_POLYGONMUMBAI}"
POLYGONMUMBAI_PRIVATEKEY = "${POLYGONMUMBAI_PRIVATEKEY}"

RPC_KALEIDO_USER = "${RPC_KALEIDO_USER}"
RPC_KALEIDO_PASS = "${RPC_KALEIDO_PASS}"
RPC_KALEIDO_ENDPOINT = "${RPC_KALEIDO_ENDPOINT}"

KALEIDO_PRIVATEKEY = "${KALEIDO_PRIVATEKEY}"`)
}

module.exports = {
  name,
  symbol,
  decimals,
  retrieveProxyAdminContractAddress,
  getImplementation,
  upgradeContract,
  exportResultToJson,
  retrieveContractFromResultToJson,
  missingEnvVariables,
  delay,
  writeEnvFile
}