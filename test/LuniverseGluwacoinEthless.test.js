const { ethers } = require("ethers");
const Tx = require('ethereumjs-tx').Transaction;
const { expect } = require('chai');
const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');

const abi = require('./abi');  
const privateKey = "0x9b22b7e2747a59e7eb138c0820f511153476f8eb2005960a28a3033a32df909f";  
//V2
const luniversePRC = "http://baas-rpc.luniverse.io:8545?lChainId=1635501961136826136";  
//classic
// const luniversePRC = "http://baas-rpc.luniverse.io:8545?lChainId=5300575914426995782";

const Token01_Address="0x6EB9871a9E52ad76e5f8e11A2864A13Ef3ea133f";
const Token02_Address="0x9bE1F71A309DD428A100Ac599242F19Ffb1dbFb6";
const Token03_Address="0x8d43899B47aD432c2f7fc648777e5c0C5Fa8ccC7";               // GLA679_LuniverseGluwacoinV3

const ProxyAdmin_Address = "0x907A29F994c16d8427567A442238F64629929659";          // GLA666_ProxyAdmin_16feb2022
const TransparentProxy_Address = "0xB65dCcaB8f4B07cB96cDeC34994f378345d037c9";    // GLA679_ProxyTransparen_09mar2022

this.provider = new ethers.providers.JsonRpcProvider(luniversePRC);
this.wallet = new ethers.Wallet(privateKey,this.provider);

const peg_sender = "0x8eB7f093233a24bcFe22F74edd67feeca13a65d5";
const peg_value = 1000;
const gluwaApproved = false;
const luniverseApproved = true;
const proccessed = false;
const name = 'LuniverseGluwacoin';
const symbol = 'LG';
const decimals = new BN('18');
const chainId = new BN('1635501961136826136');
const SigDomainBurn = 1;
const SigDomainTransfer = 3;
const SigDomainReserve = 4;
const fee = 1;
const sendAmount = 50;
var sign = require('./signature');
var newSign = require('./newSignature');

async function txn(_input, _to){
        this.provider = new ethers.providers.JsonRpcProvider(luniversePRC);
        this.wallet = new ethers.Wallet(privateKey,this.provider);
        const txCount = await this.provider.getTransactionCount(this.wallet.address);
        var rawTx = {
                nonce: ethers.utils.hexlify(txCount),
                to: _to,
                value: 0x00,
                gasLimit: ethers.utils.hexlify(1950000),
                gasPrice: ethers.utils.hexlify(23810000000000),
                data: _input.data
                };
        const rawTransactionHex = await this.wallet.signTransaction(rawTx);
        const { hash } = await this.provider.sendTransaction(rawTransactionHex);
        await this.provider.waitForTransaction(hash);
}
describe('Token01 Test',()=>{
        before(async()=>{           
                this.ProxyAdmin = await new ethers.Contract(ProxyAdmin_Address, abi.ProxyAdmin, this.wallet);
                const input = await this.ProxyAdmin.connect(this.wallet).populateTransaction.upgrade(TransparentProxy_Address, Token01_Address);
                await txn(input, ProxyAdmin_Address);
                this.Token = await new ethers.Contract(TransparentProxy_Address, abi.TokenEthlessSupport, this.wallet);
        });
       
        it('Current implement logic is Token01',async()=>{
                expect(await this.ProxyAdmin.getProxyImplementation(TransparentProxy_Address)).to.equal(Token01_Address);
        });
        it('New Function not found in Token01',async()=>{
                try{
                        expect.fail(await this.Token.newFunc());
                }catch(err){
                        console.log('New Function not exists in Token01');
                }
        });
        it('New Variable not found in Token01',async()=>{

                try{
                        expect.fail(await this.Token.newVar());
                }catch(err){
                        console.log('New Variable not exists in Token01');
                }
        });
        
        it('deployer has Gluwa role', async()=> {
            var deployerIsGluwa = await this.Token.isGluwa(this.wallet.address);
                if (!deployerIsGluwa) {
                        let inputGluwaRole = await this.Token.connect(this.wallet).populateTransaction.addGluwa(this.wallet.address);     
                        await txn(inputGluwaRole, TransparentProxy_Address);
                }
            expect(await this.Token.isGluwa(this.wallet.address)).to.be.equal(true);
        });
        
        it('Approve test',async()=>{
            let input = await this.Token.connect(this.wallet).populateTransaction.approve(Token01_Address,1000);     
            await txn(input, TransparentProxy_Address);
            expect(parseInt(await this.Token.allowance(this.wallet.address, Token01_Address))).to.equal(1000);;
        });
        it('peg test', async ()=>{
             var randHash = await web3.utils.randomHex(32);
            input = await this.Token.connect(this.wallet).populateTransaction.peg(randHash, peg_value, peg_sender);
            await txn(input, TransparentProxy_Address);
            input = await this.Token.connect(this.wallet).populateTransaction.luniverseApprove(randHash);
            await txn(input, TransparentProxy_Address);

            var [_pegValue, _pegSender, _gluwaApproved, _luniverseApproved, _proccessed] = await this.Token.getPeg(randHash);

            expect(parseInt(_pegValue._hex, 16)).to.equal(peg_value);
            expect(_pegSender).to.equal(peg_sender);
            expect(_gluwaApproved).to.equal(gluwaApproved);
            expect(_luniverseApproved).to.equal(luniverseApproved);
            expect(_proccessed).to.equal(proccessed);
        });
        it('EthlessTransfer test', async ()=>{
                var randHash = await web3.utils.randomHex(32);
                input = await this.Token.connect(this.wallet).populateTransaction.peg(randHash, peg_value, this.wallet.address);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.luniverseApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.gluwaApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.mint(randHash);
                await txn(input, TransparentProxy_Address);
                currBalance = parseInt(await this.Token.balanceOf(peg_sender));

                var nonce = Date.now();
                var signature = sign.signTransfer(SigDomainTransfer,chainId,this.Token.address, this.wallet.address, privateKey, peg_sender, sendAmount - fee, fee, nonce);       
                var overrides = {
                        gasLimit: 9000000
                };
                input = await this.Token.connect(this.wallet)['transfer(address,address,uint256,uint256,uint256,bytes)'](this.wallet.address, peg_sender, sendAmount - fee, fee, nonce, signature, { from: this.wallet.address, gasLimit: 9000000 });
                res1 = await this.provider.waitForTransaction(input.hash);
                
                expect(parseInt(await this.Token.balanceOf(peg_sender))).to.equal(currBalance + sendAmount -fee);
        });
        it('Role test', async()=>{            
            var isGluwa = await this.Token.isGluwa(peg_sender);
            input = isGluwa ?await this.Token.connect(this.wallet).populateTransaction.removeGluwa(peg_sender):
            await this.Token.connect(this.wallet).populateTransaction.addGluwa(peg_sender);
            await txn(input, TransparentProxy_Address);
            expect(isGluwa).to.equal(!await this.Token.isGluwa(peg_sender));
        });
});

describe('Token02 - After upgrade test',()=>{
        before(async()=>{
                this.ProxyAdmin = await new ethers.Contract(ProxyAdmin_Address, abi.ProxyAdmin, this.wallet);
                const input = await this.ProxyAdmin.connect(this.wallet).populateTransaction.upgrade(TransparentProxy_Address, Token02_Address);
                await txn(input, ProxyAdmin_Address);
                this.Token = await new ethers.Contract(TransparentProxy_Address, abi.Token, this.wallet);
        });
        it('Current implement logic is Token02',async()=>{
                expect(await this.ProxyAdmin.getProxyImplementation(TransparentProxy_Address)).to.equal(Token02_Address);
        });
        it('Approve test',async()=>{
                let input = await this.Token.connect(this.wallet).populateTransaction.approve(Token01_Address,1000);     
                await txn(input, TransparentProxy_Address);
                expect(parseInt(await this.Token.allowance(this.wallet.address, Token01_Address))).to.equal(1000);;
        });
        it('deployer has Gluwa role', async()=> {
            expect(await this.Token.isGluwa(this.wallet.address)).to.be.equal(true);
        });
        
        it('peg test', async ()=>{
                var randHash = await web3.utils.randomHex(32);
                input = await this.Token.connect(this.wallet).populateTransaction.peg(randHash, peg_value, peg_sender);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.luniverseApprove(randHash);
                await txn(input, TransparentProxy_Address);
    
                var [_pegValue, _pegSender, _gluwaApproved, _luniverseApproved, _proccessed] = await this.Token.getPeg(randHash);
    
            
            expect(parseInt(_pegValue._hex, 16)).to.equal(peg_value);
            expect(_pegSender).to.equal(peg_sender);
            expect(_gluwaApproved).to.equal(gluwaApproved);
            expect(_luniverseApproved).to.equal(luniverseApproved);
            expect(_proccessed).to.equal(proccessed);
        });
        it('EthlessTransfer test', async ()=>{
                var randHash = await web3.utils.randomHex(32);
                input = await this.Token.connect(this.wallet).populateTransaction.peg(randHash, peg_value, this.wallet.address);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.luniverseApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.gluwaApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.mint(randHash);
                await txn(input, TransparentProxy_Address);
                currBalance = parseInt(await this.Token.balanceOf(peg_sender));
                var nonce = Date.now();
                
                var signature = sign.signTransfer(SigDomainTransfer,chainId,this.Token.address, this.wallet.address, privateKey, peg_sender, sendAmount - fee, fee, nonce);       
                var overrides = {
                        gasLimit: 9000000
                };
                input =  await this.Token['transfer(address,address,uint256,uint256,uint256,bytes)'](this.wallet.address, peg_sender, sendAmount - fee, fee, nonce, signature, { from: this.wallet.address, gasLimit: 9000000 });
                res1 = await this.provider.waitForTransaction(input.hash);
                
                expect(parseInt(await this.Token.balanceOf(peg_sender))).to.equal(currBalance + sendAmount -fee);
           });
});

describe('Token03 - After upgrade test',()=>{
        before(async()=>{
                this.ProxyAdmin = await new ethers.Contract(ProxyAdmin_Address, abi.ProxyAdmin, this.wallet);

                const input = await this.ProxyAdmin.connect(this.wallet).populateTransaction.upgrade(TransparentProxy_Address, Token03_Address);
                await txn(input, ProxyAdmin_Address);
                this.Token = await new ethers.Contract(TransparentProxy_Address, abi.TokenV3, this.wallet);
        });
        it('Current implement logic is Token03',async()=>{
                expect(await this.ProxyAdmin.getProxyImplementation(TransparentProxy_Address)).to.equal(Token03_Address);
        });
        it('Approve test',async()=>{
                let input = await this.Token.connect(this.wallet).populateTransaction.approve(Token01_Address,1000);     
                await txn(input, TransparentProxy_Address);
                expect(parseInt(await this.Token.allowance(this.wallet.address, Token01_Address))).to.equal(1000);;
        });
        it('deployer has Gluwa role', async()=> {
            expect(await this.Token.isGluwa(this.wallet.address)).to.be.equal(true);
        });
        
        it('peg test', async ()=>{
                var randHash = await web3.utils.randomHex(32);
                input = await this.Token.connect(this.wallet).populateTransaction.peg(randHash, peg_value, peg_sender);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.luniverseApprove(randHash);
                await txn(input, TransparentProxy_Address);
    
                var [_pegValue, _pegSender, _gluwaApproved, _luniverseApproved, _proccessed] = await this.Token.getPeg(randHash);
    
            
            expect(parseInt(_pegValue._hex, 16)).to.equal(peg_value);
            expect(_pegSender).to.equal(peg_sender);
            expect(_gluwaApproved).to.equal(gluwaApproved);
            expect(_luniverseApproved).to.equal(luniverseApproved);
            expect(_proccessed).to.equal(proccessed);
        });
        it('EthlessTransfer test', async ()=>{
                const randHash = await web3.utils.randomHex(32);
                input = await this.Token.connect(this.wallet).populateTransaction.peg(randHash, peg_value, this.wallet.address);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.luniverseApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.gluwaApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.mint(randHash);
                await txn(input, TransparentProxy_Address);
                currBalance = parseInt(await this.Token.balanceOf(peg_sender));

                const nonce = Date.now();
                const signature = newSign.signTransfer(SigDomainTransfer, chainId, this.Token.address, this.wallet.address, privateKey, peg_sender, sendAmount - fee, fee, nonce);

                input = await this.Token['transfer(address,address,uint256,uint256,uint256,bytes)'](this.wallet.address, peg_sender, sendAmount - fee, fee, nonce, signature, { from: this.wallet.address, gasLimit: 9000000 });
                res1 = await this.provider.waitForTransaction(input.hash);

                expect(parseInt(await this.Token.balanceOf(peg_sender))).to.equal(currBalance + sendAmount -fee);
        });

        it('cannot call EthLess transfer() with the same nonce twice', async ()=>{
                const randHash = await web3.utils.randomHex(32);
                input = await this.Token.connect(this.wallet).populateTransaction.peg(randHash, peg_value, this.wallet.address);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.luniverseApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.gluwaApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.mint(randHash);
                await txn(input, TransparentProxy_Address);
                currBalance = parseInt(await this.Token.balanceOf(peg_sender));

                const nonce = Date.now();
                const signature = newSign.signTransfer(SigDomainTransfer, chainId, this.Token.address, this.wallet.address, privateKey, peg_sender, sendAmount - fee, fee, nonce);

                input = await this.Token['transfer(address,address,uint256,uint256,uint256,bytes)'](this.wallet.address, peg_sender, sendAmount - fee, fee, nonce, signature, { from: this.wallet.address, gasLimit: 9000000 });
                res1 = await this.provider.waitForTransaction(input.hash);

                expect(parseInt(await this.Token.balanceOf(peg_sender))).to.equal(currBalance + sendAmount -fee);
                
                input = await this.Token['transfer(address,address,uint256,uint256,uint256,bytes)'](this.wallet.address, peg_sender, sendAmount - fee, fee, nonce, signature, { from: this.wallet.address, gasLimit: 9000000 });
                res1 = await this.provider.waitForTransaction(input.hash);

                expect(res1.status).to.be.equal(0)
        });

        it('EthlessBurn test', async ()=>{
                const randHash = await web3.utils.randomHex(32);
                input = await this.Token.connect(this.wallet).populateTransaction.peg(randHash, peg_value, this.wallet.address);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.luniverseApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.gluwaApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.mint(randHash);
                await txn(input, TransparentProxy_Address);
                currBalance = parseInt(await this.Token.balanceOf(this.wallet.address));

                const nonce = Date.now();
                const signature = newSign.signBurn(SigDomainBurn, chainId, this.Token.address, this.wallet.address, privateKey, sendAmount - fee, fee, nonce);

                input = await this.Token['burn(address,uint256,uint256,uint256,bytes)'](this.wallet.address, sendAmount - fee, fee, nonce, signature, { from: this.wallet.address, gasLimit: 9000000 });
                res1 = await this.provider.waitForTransaction(input.hash);

                expect(parseInt(await this.Token.balanceOf(this.wallet.address))).to.equal(currBalance - (sendAmount - fee - fee));
        });

        it('cannot call EthLess burn() with the same nonce twice', async ()=>{
                const randHash = await web3.utils.randomHex(32);
                input = await this.Token.connect(this.wallet).populateTransaction.peg(randHash, peg_value, this.wallet.address);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.luniverseApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.gluwaApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.mint(randHash);
                await txn(input, TransparentProxy_Address);
                currBalance = parseInt(await this.Token.balanceOf(this.wallet.address));

                const nonce = Date.now();
                const signature = newSign.signBurn(SigDomainBurn, chainId, this.Token.address, this.wallet.address, privateKey, sendAmount - fee, fee, nonce);

                input = await this.Token['burn(address,uint256,uint256,uint256,bytes)'](this.wallet.address, sendAmount - fee, fee, nonce, signature, { from: this.wallet.address, gasLimit: 9000000 });
                res1 = await this.provider.waitForTransaction(input.hash);
                
                expect(parseInt(await this.Token.balanceOf(this.wallet.address))).to.equal(currBalance - (sendAmount - fee - fee));
                
                input = await this.Token['burn(address,uint256,uint256,uint256,bytes)'](this.wallet.address, sendAmount - fee, fee, nonce, signature, { from: this.wallet.address, gasLimit: 9000000 });
                res1 = await this.provider.waitForTransaction(input.hash);

                expect(res1.status).to.be.equal(0)
        });

        it('EthlessReserve test', async ()=>{
                const randHash = await web3.utils.randomHex(32);
                input = await this.Token.connect(this.wallet).populateTransaction.peg(randHash, peg_value, this.wallet.address);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.luniverseApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.gluwaApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.mint(randHash);
                await txn(input, TransparentProxy_Address);
                currBalance = parseInt(await this.Token.balanceOf(this.wallet.address));
                currReserved = parseInt(await this.Token.reservedOf(this.wallet.address));

                const nonce = Date.now();
                const expiryBlockNum = 9000000000000000;
                const signature = newSign.signReserve(SigDomainReserve, chainId, this.Token.address, this.wallet.address, privateKey, peg_sender, this.wallet.address, sendAmount - fee, fee, nonce, expiryBlockNum);

                input = await this.Token.reserve(this.wallet.address, peg_sender, this.wallet.address, sendAmount - fee, fee, nonce, expiryBlockNum, signature, { from: this.wallet.address, gasLimit: 9000000 });
                res1 = await this.provider.waitForTransaction(input.hash);

                expect(parseInt(await this.Token.balanceOf(this.wallet.address))).to.equal(currBalance - sendAmount);
                expect(parseInt(await this.Token.reservedOf(this.wallet.address))).to.equal(currReserved + sendAmount);
        });

        it('cannot call reserve() with the same nonce twice', async ()=>{
                const randHash = await web3.utils.randomHex(32);
                input = await this.Token.connect(this.wallet).populateTransaction.peg(randHash, peg_value, this.wallet.address);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.luniverseApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.gluwaApprove(randHash);
                await txn(input, TransparentProxy_Address);
                input = await this.Token.connect(this.wallet).populateTransaction.mint(randHash);
                await txn(input, TransparentProxy_Address);
                currBalance = parseInt(await this.Token.balanceOf(this.wallet.address));
                currReserved = parseInt(await this.Token.reservedOf(this.wallet.address));

                const nonce = Date.now();
                const expiryBlockNum = 9000000000000000;
                const signature = newSign.signReserve(SigDomainReserve, chainId, this.Token.address, this.wallet.address, privateKey, peg_sender, this.wallet.address, sendAmount - fee, fee, nonce, expiryBlockNum);

                input = await this.Token.reserve(this.wallet.address, peg_sender, this.wallet.address, sendAmount - fee, fee, nonce, expiryBlockNum, signature, { from: this.wallet.address, gasLimit: 9000000 });
                res1 = await this.provider.waitForTransaction(input.hash);

                expect(parseInt(await this.Token.balanceOf(this.wallet.address))).to.equal(currBalance - sendAmount);
                expect(parseInt(await this.Token.reservedOf(this.wallet.address))).to.equal(currReserved + sendAmount);
                
                input = await this.Token.reserve(this.wallet.address, peg_sender, this.wallet.address, sendAmount - fee, fee, nonce, expiryBlockNum, signature, { from: this.wallet.address, gasLimit: 9000000 });
                res1 = await this.provider.waitForTransaction(input.hash);

                expect(res1.status).to.be.equal(0)
        });
});
