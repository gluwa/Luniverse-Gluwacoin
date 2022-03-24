const { ContractFactory } = require('@ethersproject/contracts');
const { expect, use} = require('chai');
const { solidity } = require('ethereum-waffle');
const hre = require('hardhat');
use(solidity);

const LuniverseGluwaCoinInfo = require('./upgradeability/LuniverseGluwaCoinInfo');
const abi = require('./upgradeability/abi');
const { ethers } = require('ethers');

const name = 'LuniverseGluwacoin';
const symbol = 'LG';
const decimals = 18;

async function txn(input, to, sender, ethers, provider) {   
    const txCount = await provider.getTransactionCount(sender.address);
    if (hre.network.name === 'kaleido') {
      var rawTx = {
        nonce: ethers.utils.hexlify(txCount),
        to: to,
        value: 0x00,
        gasLimit: ethers.utils.hexlify(3000000),
        gasPrice: ethers.utils.hexlify(0),
        data: input.data
      };
    } else {
      var rawTx = {
        nonce: ethers.utils.hexlify(txCount),
        to: to,
        value: 0x00,
        gasLimit: ethers.utils.hexlify(3000000),
        gasPrice: ethers.utils.hexlify(2381000000000),
        data: input.data
      };
    }
    const rawTransactionHex = await sender.signTransaction(rawTx);
    const { hash } = await provider.sendTransaction(rawTransactionHex);
    return await provider.waitForTransaction(hash);
}

async function upgradeContract(implement, ethers){
    var gluwaInfo = await LuniverseGluwaCoinInfo();
    var ProxyAdmin = gluwaInfo.ProxyAdmin;
    var owner = gluwaInfo.Owner;
    await ProxyAdmin.upgrade(gluwaInfo.TransparentProxy.address, implement, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
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
    contract =  await new ethers.Contract(gluwaInfo.TransparentProxy.address, abi.Token, owner);
    return contract;
}

async function getImplementation(ethers){
    var gluwaInfo = await LuniverseGluwaCoinInfo();
    var ProxyAdmin = gluwaInfo.ProxyAdmin;
    var owner = gluwaInfo.Owner;

    const input = await ProxyAdmin.getProxyImplementation(gluwaInfo.TransparentProxy.address);
  //  const implementationAddress = await txn(input, ProxyAdmin.address, owner, ethers, gluwaInfo.provider);
    return input;
}

async function createContractInstance(ethers) {
  gluwaInfo = await LuniverseGluwaCoinInfo();
  if(gluwaInfo.network == "hardhat") {
    [wallet] = await ethers.getSigners();
    provider = ethers.provider;
    owner = gluwaInfo.User;
    owner = new ethers.Wallet(gluwaInfo.OwnerKey,provider);
    user1 = await ethers.Wallet.createRandom();
    user2 = await ethers.Wallet.createRandom();
    user3 = await ethers.Wallet.createRandom();
    GluwacoinFactory = await ethers.getContractFactory("LuniverseGluwacoin");
    Gluwacoin = new ContractFactory(GluwacoinFactory.interface, GluwacoinFactory.bytecode, owner);
    await wallet.sendTransaction({
      to: owner.address,
      value: ethers.utils.parseEther("500.0")
    });
    await wallet.sendTransaction({
      to: user1.address,
      value: ethers.utils.parseEther("300.0")
    });
    await wallet.sendTransaction({
      to: user2.address,
      value: ethers.utils.parseEther("100.0")
    });
    await wallet.sendTransaction({
      to: user3.address,
      value: ethers.utils.parseEther("100.0")
    });
    
  } else {
    Gluwacoin = null;
    provider = gluwaInfo.provider;
    owner = gluwaInfo.Owner;
    user1 = await ethers.Wallet.createRandom();
    user2 = await ethers.Wallet.createRandom();
    user3 = await ethers.Wallet.createRandom();
  }
  return {
    'owner':owner, 
    'user1':user1, 
    'user2':user2, 
    'user3':user3,
    'GluwacoinFactory':Gluwacoin, 
    'provider':provider
  };
}

async function initializeContract(Gluwacoin, owner, user1, user2, ethers, provider){
  gluwaInfo = await LuniverseGluwaCoinInfo();
  if(gluwaInfo.network == "hardhat") {
      gluwaCoin = await Gluwacoin.connect(owner).deploy();
      await gluwaCoin.deployed();

      input = await gluwaCoin.connect(owner).populateTransaction.initialize(name, symbol, decimals);
      await txn(input, gluwaCoin.address, owner, ethers, provider);
      
    } else {
      gluwaCoin = gluwaInfo.Token;
      try {
        const checkName = await gluwaCoin.connect(owner).name();
        
        if (checkName == "") {
          input = await gluwaCoin.connect(owner).populateTransaction.initialize(name, symbol, decimals);
          await txn(input, gluwaCoin.address, owner, ethers, provider);
        }
      } catch(err) {
        input = await gluwaCoin.connect(owner).populateTransaction.initialize(name, symbol, decimals);
        await txn(input, gluwaCoin.address, owner, ethers, provider);
      }
    }
    return {'gluwaCoin':gluwaCoin};
}

async function clearBalanceAndAllowance(contract, owner, user1, user2, user3){
  const startBalanceOwner = await contract.balanceOf(owner.address);
  const startBalanceUser1 = await contract.balanceOf(user1.address);
  const startBalanceUser2 = await contract.balanceOf(user2.address);
  const startBalanceUser3 = await contract.balanceOf(user3.address);

  if (startBalanceOwner.toNumber() > 0) {
          const input = await contract.connect(owner).populateTransaction['burn(uint256)'](startBalanceOwner);
          await txn(input, contract.address, owner, ethers, provider);
  }
  if (startBalanceUser1.toNumber() > 0) {
          const input = await contract.connect(user1).populateTransaction['burn(uint256)'](startBalanceUser1);
          await txn(input, contract.address, user1, ethers, provider);
  }
  if (startBalanceUser2.toNumber() > 0) {
          const input = await contract.connect(user2).populateTransaction['burn(uint256)'](startBalanceUser2);
          await txn(input, contract.address, user2, ethers, provider);
  }
  if (startBalanceUser3.toNumber() > 0) {
          const input = await contract.connect(user3).populateTransaction['burn(uint256)'](startBalanceUser3);
          await txn(input, contract.address, user3, ethers, provider);
  }

  const startAllowanceOwner = await contract.allowance(owner.address, contract.address);
  const startAllowanceUser1 = await contract.allowance(user1.address, contract.address);
  const startAllowanceUser2 = await contract.allowance(user2.address, contract.address);
  const startAllowanceUser3 = await contract.allowance(user3.address, contract.address);

  if (startAllowanceOwner.toNumber() > 0) {
          const input = await contract.connect(owner).populateTransaction.approve(contract.address, 0);
          await txn(input, contract.address, owner, ethers, provider);
  }
  if (startAllowanceUser1.toNumber() > 0) {
          const input = await contract.connect(user1).populateTransaction.approve(contract.address, 0);
          await txn(input, contract.address, user1, ethers, provider);
  }
  if (startAllowanceUser2.toNumber() > 0) {
          const input = await contract.connect(user2).populateTransaction.approve(contract.address, 0);
          await txn(input, contract.address, user2, ethers, provider);
  }
  if (startAllowanceUser3.toNumber() > 0) {
          const input = await contract.connect(user3).populateTransaction.approve(contract.address, 0);
          await txn(input, contract.address, user3, ethers, provider);
  }

  const startAllowanceUser1FromOwner = await contract.allowance(user1.address, owner.address);
  const startAllowanceUser2FromOwner = await contract.allowance(user2.address, owner.address);
  const startAllowanceUser3FromOwner = await contract.allowance(user3.address, owner.address);

  if (startAllowanceUser1FromOwner.toNumber() > 0) {
          const input = await contract.connect(user1).populateTransaction.approve(owner.address, 0);
          await txn(input, contract.address, user1, ethers, provider);
  }
  if (startAllowanceUser2FromOwner.toNumber() > 0) {
          const input = await contract.connect(user2).populateTransaction.approve(owner.address, 0);
          await txn(input, contract.address, user2, ethers, provider);
  }
  if (startAllowanceUser3FromOwner.toNumber() > 0) {
          const input = await contract.connect(user3).populateTransaction.approve(owner.address, 0);
          await txn(input, contract.address, user3, ethers, provider);
  }

  const startAllowanceOwnerFromUser1 = await contract.allowance(owner.address, user1.address);
  const startAllowanceUser2FromUser1 = await contract.allowance(user2.address, user1.address);
  const startAllowanceUser3FromUser1 = await contract.allowance(user3.address, user1.address);

  if (startAllowanceOwnerFromUser1.toNumber() > 0) {
          const input = await contract.connect(owner).populateTransaction.approve(user1.address, 0);
          await txn(input, contract.address, owner, ethers, provider);
  }
  if (startAllowanceUser2FromUser1.toNumber() > 0) {
          const input = await contract.connect(user2).populateTransaction.approve(user1.address, 0);
          await txn(input, contract.address, user2, ethers, provider);
  }
  if (startAllowanceUser3FromUser1.toNumber() > 0) {
          const input = await contract.connect(user3).populateTransaction.approve(user1.address, 0);
          await txn(input, contract.address, user3, ethers, provider);
  }

  const startAllowanceOwnerFromUser2 = await contract.allowance(owner.address, user2.address);
  const startAllowanceUser1FromUser2 = await contract.allowance(user1.address, user2.address);
  const startAllowanceUser3FromUser2 = await contract.allowance(user3.address, user2.address);

  if (startAllowanceOwnerFromUser2.toNumber() > 0) {
          const input = await contract.connect(owner).populateTransaction.approve(user2.address, 0);
          await txn(input, contract.address, owner, ethers, provider);
  }
  if (startAllowanceUser1FromUser2.toNumber() > 0) {
          const input = await contract.connect(user1).populateTransaction.approve(user2.address, 0);
          await txn(input, contract.address, user2, ethers, provider);
  }
  if (startAllowanceUser3FromUser2.toNumber() > 0) {
          const input = await contract.connect(user3).populateTransaction.approve(user2.address, 0);
          await txn(input, contract.address, user3, ethers, provider);
  }
}

async function createSandboxContractInstance(ethers) {
  gluwaInfo = await LuniverseGluwaCoinInfo();
  if(gluwaInfo.network == "hardhat") {
    [wallet] = await ethers.getSigners();
    provider = ethers.provider;
    owner = gluwaInfo.User;
    owner = new ethers.Wallet(gluwaInfo.OwnerKey,provider);
    user1 = await ethers.Wallet.createRandom();
    user2 = await ethers.Wallet.createRandom();
    user3 = await ethers.Wallet.createRandom();
    SandboxTokenFactory = await ethers.getContractFactory("SandboxLuniverseGluwacoin");
    SandboxToken = new ContractFactory(SandboxTokenFactory.interface, SandboxTokenFactory.bytecode, owner);
    await wallet.sendTransaction({
      to: owner.address,
      value: ethers.utils.parseEther("500.0") // 1400
    });
    await wallet.sendTransaction({
      to: user1.address,
      value: ethers.utils.parseEther("300.0")
    });
    await wallet.sendTransaction({
      to: user2.address,
      value: ethers.utils.parseEther("100.0")
    });
    await wallet.sendTransaction({
      to: user3.address,
      value: ethers.utils.parseEther("100.0")
    });
    
  } else {
    SandboxToken = null;
    provider = gluwaInfo.provider;
    owner = gluwaInfo.Owner;
    user1 = await ethers.Wallet.createRandom();
    user2 = await ethers.Wallet.createRandom();
    user3 = await ethers.Wallet.createRandom();
  }
  return {
    'owner':owner, 
    'user1':user1, 
    'user2':user2, 
    'user3':user3,
    'SandboxTokenFactory':SandboxToken, 
    'provider':provider
  };
}

async function initializeSandboxContract(SandboxToken, owner, user1, user2, ethers, provider){
  gluwaInfo = await LuniverseGluwaCoinInfo();
  if(gluwaInfo.network == "hardhat") {

      sandboxToken = await SandboxToken.connect(owner).deploy();
      await sandboxToken.deployed();

      input = await sandboxToken.connect(owner).populateTransaction.initialize(name, symbol, decimals);
      await txn(input, sandboxToken.address, owner, ethers, provider);
      
    } else {
      sandboxToken = gluwaInfo.SandboxToken;
      
      try {
        const checkName = await gluwaCoin.connect(owner).name();
        
        if (checkName == "") {
          input = await sandboxToken.connect(owner).populateTransaction.initialize(name, symbol, decimals);
          await txn(input, sandboxToken.address, owner, ethers, provider);
        }
      } catch(err) {
        input = await sandboxToken.connect(owner).populateTransaction.initialize(name, symbol, decimals);
        await txn(input, sandboxToken.address, owner, ethers, provider);
      }
    }
    return {'sandboxToken':sandboxToken};
}

async function checkResult(input, to, from, ethers, provider, errMsg) {
  var gluwaInfo = await LuniverseGluwaCoinInfo();

  if(gluwaInfo.network == "hardhat") {
    if(errMsg) {
      await expect(
        txn(input, to, from, ethers, provider)
      ).to.be.revertedWith(errMsg);
    }
    else {
      result = await txn(input, to, from, ethers, provider);
      expect(result.status).to.equal(1);
    }
    
  } else {
    if(errMsg) {
      result = await txn(input, to, from, ethers, provider);
      expect(result.status).to.equal(0);
    }
    else {
      result = await txn(input, to, from, ethers, provider);
      expect(result.status).to.equal(1);
    }
  }
}

async function mineBlocks(provider, n) {
  for (let i = 0; i <= n; i++) {
    await provider.send('evm_mine');
  }
}

const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  name, 
  symbol, 
  decimals, 
  txn, 
  upgradeContract,
  getImplementation,
  createContractInstance, 
  initializeContract,
  clearBalanceAndAllowance,
  createSandboxContractInstance,
  initializeSandboxContract,
  checkResult,
  mineBlocks,
  delay
}