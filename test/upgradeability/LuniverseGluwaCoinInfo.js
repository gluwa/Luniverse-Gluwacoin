require('dotenv').config({path:__dirname+'/.env.development'});
const abi = require('./abi');
const fs = require('fs');
const hre = require('hardhat');

console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', hre.network.name, hre.network.config.chainId);

const fileContractsAddressDeployed = 'contractsAddressDeployed.json';

// Hardhat default account(0)
let privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
let userKey = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
let rpcUrl = '';

if(hre.network.name === 'kaleido') {
    privateKey = `${process.env.KALEIDO_PRIVATEKEY}`;
    userKey = `${process.env.KALEIDO_PRIVATEKEY}`;

    const USER = `${process.env.RPC_KALEIDO_USER}`;
    const PASS = `${process.env.RPC_KALEIDO_PASS}`;
    const RPC_ENDPOINT = `https://${process.env.RPC_KALEIDO_ENDPOINT}`;
    rpcUrl = {url: RPC_ENDPOINT, user: USER, password: PASS};
}
if(hre.network.name === 'ethereum') {
    privateKey = `${process.env.ETHMAINNET_PRIVATEKEY}`;
    userKey = `${process.env.ETHMAINNET_PRIVATEKEY}`;
    rpcUrl = `${process.env.RPC_ETHMAINNET}`;
}
if(hre.network.name === 'ropsten') {
    privateKey = `${process.env.ROPSTEN_PRIVATEKEY}`;
    userKey = `${process.env.ROPSTEN_PRIVATEKEY}`;
    rpcUrl = `${process.env.RPC_ROPSTEN}`;
}
if(hre.network.name === 'rinkeby') {
    privateKey = `${process.env.RINKEBY_PRIVATEKEY}`;
    userKey = `${process.env.RINKEBY_PRIVATEKEY}`;
    rpcUrl = `${process.env.RPC_RINKEBY}`;
}
if(hre.network.name === 'kovan') {
    privateKey = `${process.env.KOVAN_PRIVATEKEY}`;
    userKey = `${process.env.KOVAN_PRIVATEKEY}`;
    rpcUrl = `${process.env.RPC_KOVAN}`;
}
if(hre.network.name === 'polygon') {
    privateKey = `${process.env.POLYGONMAINNET_PRIVATEKEY}`;
    userKey = `${process.env.POLYGONMAINNET_PRIVATEKEY}`;
    rpcUrl = `${process.env.RPC_POLYGONMAINNET}`;
}
if(hre.network.name === 'mumbai') {
    privateKey = `${process.env.POLYGONMUMBAI_PRIVATEKEY}`;
    userKey = `${process.env.POLYGONMUMBAI_PRIVATEKEY}`;
    rpcUrl = `${process.env.RPC_POLYGONMUMBAI}`;
}

let ContractAddress = {
    ProxyAdmin_Address: '0x417c4C7298F20351b3d8F45ce20E32A9026BC31b'
}
// Contracts Address previously deployed on Kaleido
let ProxyAdmin_Address = "0x417c4C7298F20351b3d8F45ce20E32A9026BC31b";
let LuniverseGluwacoin_Address = "0x6e6A0D7778a8B5c722d71bF697A2036056C9F95b";
let SandboxLuniverseGluwacoin_Address = "0x6e6A0D7778a8B5c722d71bF697A2036056C9F95b";
let TransparentUpgradeableProxy_Address = "0x4f2bD74997E2ECbb277F80C480d01C908Ad1549b";
let TransparentSandboxUpgradeableProxy_Address = "0xd02d10333984f348abb88fE73851fB60d0F19202";

// Overrite address with contracts address in ./contractsAddressDeployed.json
if (fs.existsSync(fileContractsAddressDeployed)) {
    let rawdata = fs.readFileSync(fileContractsAddressDeployed);
    let contractsAddressDeployed = JSON.parse(rawdata);
    
    contractsAddressDeployed
        .filter((c) => c.network === hre.network.name)
        .map((c) => {
            if (c.name === 'ProxyAdmin')
                ProxyAdmin_Address = c.address;

            if (c.name === 'LogicLuniverseGluwacoin')
                LuniverseGluwacoin_Address = c.address;

            if (c.name === 'LogicSandboxLuniverseGluwacoin')
                SandboxLuniverseGluwacoin_Address = c.address;

            if (c.name === 'UpgradeableLuniverseGluwacoin')
                TransparentUpgradeableProxy_Address = c.address;
            if (c.name === 'UpgradeableSandboxLuniverseGluwacoin')
                TransparentSandboxUpgradeableProxy_Address = c.address;
        })
}

module.exports= async () => {
    var provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    var owner = new ethers.Wallet(privateKey, provider);
    var user1 = new ethers.Wallet(userKey, provider);
    
    var Token = await new ethers.Contract(TransparentUpgradeableProxy_Address, abi.Token, owner);
    var SandboxToken = await new ethers.Contract(TransparentSandboxUpgradeableProxy_Address, abi.SandboxToken, owner);

    var ProxyAdmin = await new ethers.Contract(ProxyAdmin_Address, abi.ProxyAdmin, owner);
    var TransparentProxy = await new ethers.Contract(TransparentUpgradeableProxy_Address, abi.Token, owner);

    return {
        "Token": Token,
        "SandboxToken": SandboxToken,
        "ProxyAdmin": ProxyAdmin,
        "TransparentProxy": TransparentProxy,
        "TokenLogicAddress": LuniverseGluwacoin_Address,
        "SandboxTokenLogicAddress": SandboxLuniverseGluwacoin_Address,
        "Owner": owner, 
        "OwnerKey": privateKey,
        "User": user1,
        "UserKey": userKey,
        "provider": provider,
        "network": hre.network.name, // local || luniverse || kaleido
        "ChainId": hre.network.config.chainId // 31337 (hardhat) || chainId (luniverse)
    };
}

/*
    Note for testing on luniverse

    It's possible that some of the tests, testing execute function on expired reservation fail.
    The issue seams to be @openzeppelin/test-helpers not detecting the RPC.

    One way to solve the issue is to edit the node_modules/@openzeppelin/test-helpers/src/config/web3.js file
    line 5 with const DEFAULT_PROVIDER_URL = 'http://baas-rpc.luniverse.io:8545?lChainId=1635501961136826136';
*/