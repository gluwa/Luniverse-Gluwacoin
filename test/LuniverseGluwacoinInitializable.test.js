const { ethers } = require("ethers");
const Tx = require('ethereumjs-tx').Transaction;
const { expect } = require('chai');
const { BN,constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');

const abi = require('./abi');  
const privateKey = "ac12c709f163f3962b6ebf5b041d6fb6d8f838a42b43666a841e20c60d49c709";  
const luniversePRC = "http://baas-rpc.luniverse.io:8545?lChainId=5300575914426995782";

const Token01_Address="0xfE42B3A3ef1138a477b335205176FB3679C21c66";
const Token02_Address="0x56f5163C410b3c119B5e996e2aB4717890B9B7Dd";
const ProxyAdmin_Address="0xA1BBc2aFF9f61c9fA94E40F04a195D450E0B5015";
const TransparentProxy_Address="0x35ED566C8723Fe1EEfced1F912016C980701817d";

this.provider = new ethers.providers.JsonRpcProvider(luniversePRC);
this.wallet = new ethers.Wallet(privateKey,this.provider);

const peg_hash = "0xa82932d617fcea223bdeae0a7394e17f4690f9358b8f1dfb95f040621f2eecc5";
const peg_sender = "0x8eB7f093233a24bcFe22F74edd67feeca13a65d5";
const peg_value = 1000;
const gluwaApproved = false;
const luniverseApproved = true;
const proccessed = false;


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
        const tx = new Tx(rawTx); 
        const rawTransactionHex = await this.wallet.signTransaction(rawTx);
        const { hash } = await this.provider.sendTransaction(rawTransactionHex);
        await this.provider.waitForTransaction(hash);
}
describe('Token01 Test',()=>{
        before(async()=>{           
                this.ProxyAdmin = await new ethers.Contract(ProxyAdmin_Address, abi.ProxyAdmin, this.wallet);
                const input = await this.ProxyAdmin.connect(this.wallet).populateTransaction.upgrade(TransparentProxy_Address, Token01_Address);
                await txn(input, ProxyAdmin_Address);
                this.Token = await new ethers.Contract(TransparentProxy_Address, abi.Token, this.wallet);
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
            expect(await this.Token.isGluwa(this.wallet.address)).to.be.equal(true);
        });
        
        it('Approve test',async()=>{
            let input = await this.Token.connect(this.wallet).populateTransaction.approve(Token01_Address,1000);     
            await txn(input, TransparentProxy_Address);
            expect(parseInt(await this.Token.allowance(this.wallet.address, Token01_Address))).to.equal(1000);;
        });
        it('peg test', async ()=>{
            var [_pegValue, _pegSender, _gluwaApproved, _luniverseApproved, _proccessed] = await this.Token.getPeg(peg_hash);
            
            expect(parseInt(_pegValue._hex, 16)).to.equal(peg_value);
            expect(_pegSender).to.equal(peg_sender);
            expect(_gluwaApproved).to.equal(gluwaApproved);
            expect(_luniverseApproved).to.equal(luniverseApproved);
            expect(_proccessed).to.equal(proccessed);
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
        it('New Function in Token02',async()=>{
                expect(await this.Token.newFunc()).to.equal("New Funciton");
        });
        it('New Variable in Token02',async()=>{
                expect(await this.Token.newVar()).to.equal("New Variable");
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
            var [_pegValue, _pegSender, _gluwaApproved, _luniverseApproved, _proccessed] = await this.Token.getPeg(peg_hash);
            
            expect(parseInt(_pegValue._hex, 16)).to.equal(peg_value);
            expect(_pegSender).to.equal(peg_sender);
            expect(_gluwaApproved).to.equal(gluwaApproved);
            expect(_luniverseApproved).to.equal(luniverseApproved);
            expect(_proccessed).to.equal(proccessed);
        });
});
