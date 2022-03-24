require('dotenv').config({path:__dirname+'/.env.development'});
const abi = require('./abi');
const fs = require('fs');
const hre = require('hardhat');

console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', hre.network.name, hre.network.config.chainId);

const fileContractsAddressDeployed = 'contractsAddressDeployed.json';

// Hardhat default account(0)
let privateKey;
let userKey;
let rpcUrl = '';

if(hre.network.name === 'hardhat') {
    privateKey = ethers.Wallet.fromMnemonic(hre.network.config.accounts.mnemonic).privateKey;
    userKey = ethers.Wallet.fromMnemonic(hre.network.config.accounts.mnemonic).privateKey;
} else if(hre.network.name === 'kaleido') {
    privateKey = hre.network.config.accounts[0];
    userKey = hre.network.config.accounts[0];

    const USER = `${process.env.RPC_KALEIDO_USER}`;
    const PASS = `${process.env.RPC_KALEIDO_PASS}`;
    const RPC_ENDPOINT = `https://${process.env.RPC_KALEIDO_ENDPOINT}`;
    rpcUrl = {url: RPC_ENDPOINT, user: USER, password: PASS};
} else {
    privateKey = hre.network.config.accounts[0];
    userKey = hre.network.config.accounts[0];
    rpcUrl = hre.network.config.url;
}

// Contracts Address previously deployed on Kaleido
let ProxyAdmin_Address = "0xf3D0cCE35C0362c773C0cCB52723afFE5d2bF7cF";
let LuniverseGluwacoin_Address = "0xae383E821edCe2DC8401Cd81c6315c4845d8a65e";
let SandboxLuniverseGluwacoin_Address = "0xae383E821edCe2DC8401Cd81c6315c4845d8a65e";
let TransparentUpgradeableProxy_Address = "0xA66b5Ab8694f5Ed5703A9c6b9b4C79a382EC92D5";
let TransparentSandboxUpgradeableProxy_Address = "0xEe9edf17BC723cF89DfDeAAD616b5f5909594297";

// Get contracts address in ./contractsAddressDeployed.json
if (hre.network.name !== 'hardhat') {
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
    } else {
        throw(`Please deploy all contracts on the network you are running the test first.
        File contractsAddressDeployed.json Missing
        
        Run: npm run cli`);
    }
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