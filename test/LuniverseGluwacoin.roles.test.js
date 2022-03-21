const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers } = require('hardhat');
const TestHelper = require('./shared');
const SignHelper = require('./signature');
const LuniverseGluwaCoinInfo = require('./upgradeability/LuniverseGluwaCoinInfo');
use(solidity);

var owner;
var user1;
var user2;
var gluwaCoin;
var gluwaInfo;
var provider;
var zeroAddress = "0x0000000000000000000000000000000000000000";

const AdminRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
const LuniverseRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Luniverse_ROLE"));
const CollectorRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("COLLECTOR_ROLE"));
const GluwaRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GLUWA_ROLE"));

/*
 * Test `LuniverseGluwacoin`
 */
describe('LuniverseGluwacoin - Roles', function () {
        before(async ()=>{
                gluwaInfo = await LuniverseGluwaCoinInfo();
                instance = await TestHelper.createContractInstance(ethers);
                owner = instance.owner;
                user1 = instance.user1;
                user2 = instance.user2
                user3 = instance.user3;
                provider = instance.provider;
        });
        beforeEach(async ()=>{
                contracts = await TestHelper.initializeContract(Gluwacoin, owner, user1, user2, ethers, provider);
                gluwaCoin = contracts.gluwaCoin;

                if (gluwaInfo.network != "hardhat") {
                        await TestHelper.clearBalanceAndAllowance(gluwaCoin, owner, user1, user2, user3);
                }

                const ownerIsLuniverse = await gluwaCoin.isLuniverse(owner.address);
                if (!ownerIsLuniverse) {
                        const input = await gluwaCoin.connect(owner).populateTransaction.addLuniverse(owner.address);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                }
                const ownerIsGluwa = await gluwaCoin.isGluwa(owner.address);
                if (!ownerIsGluwa) {
                        const input = await gluwaCoin.connect(owner).populateTransaction.addGluwa(owner.address);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                }
        });
        
        describe('Luniverse role', () => {
                it('Deployer has Luniverse role', async () => {
                        expect(await gluwaCoin.isLuniverse(owner.address)).to.be.equal(true);
                });
                it('Add test account Luniverse role', async () => {
                        const isLuniverse = await gluwaCoin.isLuniverse(user1.address);
                        if (!isLuniverse) {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addLuniverse(user1.address);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.equal(true);
                });
                it('Remove test account Luniverse role', async () => {
                        const isLuniverse = await gluwaCoin.isLuniverse(user1.address);
                        if (!isLuniverse) {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addLuniverse(user1.address);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        const input = await gluwaCoin.connect(owner).populateTransaction.removeLuniverse(user1.address);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
            
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.equal(false);
                });
                it('Renounce test account Luniverse role', async () => {
                        const isLuniverse = await gluwaCoin.isLuniverse(user1.address);
                        if (!isLuniverse) {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addLuniverse(user1.address);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        const input = await gluwaCoin.connect(user1).populateTransaction.renounceLuniverse();
                        await TestHelper.checkResult(input, gluwaCoin.address, user1, ethers, provider, 0);
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.equal(false);
                });
                it('Non-Luniverse can\'t make themself Luniverse', async () => {
                        let msg;
                        try {
                                msg = await gluwaCoin.connect(user1).addLuniverse(user1.address, 2);
                        } catch(err) {
                                msg = 'Luniverse Role: caller does not have the Luniverse role';
                        }
                        expect(msg).to.equal('Luniverse Role: caller does not have the Luniverse role');
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.equal(false);
                });
                it('Non-Luniverse can\'t give Luniverse role', async () => {
                        let msg;
                        try {
                                msg = await gluwaCoin.connect(user1).addLuniverse(user2.address, 2);
                        } catch(err) {
                                msg = 'Luniverse Role: caller does not have the Luniverse role';
                        }
                        expect(msg).to.equal('Luniverse Role: caller does not have the Luniverse role');
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.equal(false);
                        expect(await gluwaCoin.isLuniverse(user2.address)).to.equal(false);
                });
                it('Non-Luniverse can\'t remove Luniverse role', async () => {
                        let msg;
                        try {
                                msg = await gluwaCoin.connect(user1).removeLuniverse(owner.address, 2);
                        } catch(err) {
                                msg = 'Luniverse Role: caller does not have the Luniverse role';
                        }
                        expect(msg).to.equal('Luniverse Role: caller does not have the Luniverse role');
                        expect(await gluwaCoin.isLuniverse(owner.address)).to.equal(true);
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.equal(false);
                        expect(await gluwaCoin.isLuniverse(user2.address)).to.equal(false);
                });
                it('Non-Luniverse can\'t renounce Luniverse role', async () => {
                        let msg;
                        try {
                                msg = await gluwaCoin.connect(user1).renounceLuniverse();
                        } catch(err) {
                                msg = 'Luniverse Role: caller does not have the Luniverse role';
                        }
                        expect(msg).to.equal('Luniverse Role: caller does not have the Luniverse role');
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.equal(false);
                });
        });

        describe('Gluwa role', () => {
                it('Deployer has Gluwa role', async () => {
                        expect(await gluwaCoin.isGluwa(owner.address)).to.be.equal(true);
                });
                it('Add test account Gluwa role', async () => {
                        const isGluwa = await gluwaCoin.isGluwa(user1.address);
                        if (!isGluwa) {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addGluwa(user1.address);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        expect(await gluwaCoin.isGluwa(user1.address)).to.equal(true);
                });
                it('Remove test account Gluwa role', async () => {
                        const isGluwa = await gluwaCoin.isGluwa(user1.address);
                        if (!isGluwa) {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addGluwa(user1.address);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        const input = await gluwaCoin.connect(owner).populateTransaction.removeGluwa(user1.address);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);

                        expect(await gluwaCoin.isGluwa(user1.address)).to.equal(false);
                });
                it('Renounce test account Gluwa role', async () => {
                        const isGluwa = await gluwaCoin.isGluwa(user1.address);
                        if (!isGluwa) {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addGluwa(user1.address);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        const input = await gluwaCoin.connect(user1).populateTransaction.renounceGluwa();
                        await TestHelper.checkResult(input, gluwaCoin.address, user1, ethers, provider, 0);
                        expect(await gluwaCoin.isGluwa(user1.address)).to.equal(false);
                });
                it('Non-Gluwa can\'t make themself Gluwa', async () => {
                        let msg;
                        try {
                                msg = await gluwaCoin.connect(user1).addGluwa(user1.address);
                        } catch(err) {
                                msg = 'Gluwa Role: caller does not have the Gluwa role';
                        }
                        expect(msg).to.equal('Gluwa Role: caller does not have the Gluwa role');
                        expect(await gluwaCoin.isGluwa(user1.address)).to.equal(false);
                });
                it('Non-Gluwa can\'t give Gluwa role', async () => {
                        let msg;
                        try {
                                msg = await gluwaCoin.connect(user1).addGluwa(user2.address);
                        } catch(err) {
                                msg = 'Gluwa Role: caller does not have the Gluwa role';
                        }
                        expect(msg).to.equal('Gluwa Role: caller does not have the Gluwa role');
                        expect(await gluwaCoin.isGluwa(user1.address)).to.equal(false);
                        expect(await gluwaCoin.isGluwa(user2.address)).to.equal(false);
                });
                it('Non-Gluwa can\'t remove Gluwa role', async () => {
                        let msg;
                        try {
                                msg = await gluwaCoin.connect(user1).removeGluwa(owner.address);
                        } catch(err) {
                                msg = 'Gluwa Role: caller does not have the Gluwa role';
                        }
                        expect(msg).to.equal('Gluwa Role: caller does not have the Gluwa role');
                        expect(await gluwaCoin.isGluwa(owner.address)).to.equal(true);
                        expect(await gluwaCoin.isGluwa(user1.address)).to.equal(false);
                        expect(await gluwaCoin.isGluwa(user2.address)).to.equal(false);
                });
                it('Non-Gluwa can\'t renounce Gluwa role', async () => {
                        let msg;
                        try {
                                msg = await gluwaCoin.connect(user1).renounceGluwa();
                        } catch(err) {
                                msg = 'Gluwa Role: caller does not have the Gluwa role';
                        }
                        expect(msg).to.equal('Gluwa Role: caller does not have the Gluwa role');
                        expect(await gluwaCoin.isGluwa(user1.address)).to.equal(false);
                });
        });
        
        describe('Test whenPaused', () => {
                it('cannot mint when paused', async function () {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                
                        await gluwaCoin.peg(randHashOwner, pegAmount, owner.address, { from : owner.address });
                        await gluwaCoin.gluwaApprove(randHashOwner, { from : owner.address });
                        await gluwaCoin.luniverseApprove(randHashOwner, { from : owner.address });
                
                        if(!await gluwaCoin.paused()) {
                                await gluwaCoin.pause({ from : owner.address });
                        }
                        expect(await gluwaCoin.paused()).to.be.equal(true);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 'ERC20Pausable: token transfer while paused');
                });
                it('cannot burn when paused', async function () {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                
                        await gluwaCoin.peg(randHashOwner, pegAmount, owner.address, { from : owner.address });
                        await gluwaCoin.gluwaApprove(randHashOwner, { from : owner.address });
                        await gluwaCoin.luniverseApprove(randHashOwner, { from : owner.address });
                        await gluwaCoin.mint(randHashOwner, { from : owner.address });
                
                        if(!await gluwaCoin.paused()) {
                                await gluwaCoin.pause({ from : owner.address });
                        }
                        expect(await gluwaCoin.paused()).to.be.equal(true);
                        
                        const input = await gluwaCoin.connect(owner).populateTransaction['burn(uint256)'](pegAmount);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 'ERC20Pausable: token transfer while paused');
                });
                it('cannot transfer when paused', async function () {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                
                        await gluwaCoin.peg(randHashOwner, pegAmount, owner.address, { from : owner.address });
                        await gluwaCoin.gluwaApprove(randHashOwner, { from : owner.address });
                        await gluwaCoin.luniverseApprove(randHashOwner, { from : owner.address });
                        await gluwaCoin.mint(randHashOwner, { from : owner.address });
                
                        if(!await gluwaCoin.paused()) {
                                await gluwaCoin.pause({ from : owner.address });
                        }
                        const inputTransfer = await gluwaCoin.connect(owner).populateTransaction['transfer(address,uint256)'](user1.address, pegAmount, { from: owner.address });
                        await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 'ERC20Pausable: token transfer while paused');
                });
        
                it('cannot ETHless reserve when paused', async function () {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                
                        await gluwaCoin.peg(randHashOwner, pegAmount, owner.address, { from : owner.address });
                        await gluwaCoin.gluwaApprove(randHashOwner, { from : owner.address });
                        await gluwaCoin.luniverseApprove(randHashOwner, { from : owner.address });
                        await gluwaCoin.mint(randHashOwner, { from : owner.address });
                
                        if(!await gluwaCoin.paused()) {
                                await gluwaCoin.pause({ from : owner.address });
                        }
                        const feeToPay = 10;
                        const nounce = Date.now();
                        const ownerKey = '0x' + gluwaInfo.OwnerKey;
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 2000);

                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, pegAmount, feeToPay, nounce, expirationBlock);
                        const input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                pegAmount, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 'Pausable: paused');
                });
        
                it('cannot ETHless transfer when paused', async function () {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                
                        await gluwaCoin.peg(randHashOwner, pegAmount, owner.address, { from : owner.address });
                        await gluwaCoin.gluwaApprove(randHashOwner, { from : owner.address });
                        await gluwaCoin.luniverseApprove(randHashOwner, { from : owner.address });
                        await gluwaCoin.mint(randHashOwner, { from : owner.address });
                
                        if(!await gluwaCoin.paused()) {
                                await gluwaCoin.pause({ from : owner.address });
                        }
                        const feeToPay = 10;
                        const nounce = Date.now();
                        const ownerKey = '0x' + gluwaInfo.OwnerKey;

                        const signature = SignHelper.signTransfer(3, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, pegAmount, feeToPay, nounce);
                        let input = await gluwaCoin.connect(owner).populateTransaction['transfer(address,address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                user1.address,
                                pegAmount,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 'ERC20Pausable: token transfer while paused');
                });
        
                it('cannot ETHless burn when paused', async function () {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                
                        await gluwaCoin.peg(randHashOwner, pegAmount, owner.address, { from : owner.address });
                        await gluwaCoin.gluwaApprove(randHashOwner, { from : owner.address });
                        await gluwaCoin.luniverseApprove(randHashOwner, { from : owner.address });
                        await gluwaCoin.mint(randHashOwner, { from : owner.address });
                
                        if(!await gluwaCoin.paused()) {
                                await gluwaCoin.pause({ from : owner.address });
                        }
                        const feeToPay = 100;
                        const nounce = Date.now();
                        const ownerKey = '0x' + gluwaInfo.OwnerKey;

                        const signature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, pegAmount, feeToPay, nounce);
                        let input = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                pegAmount,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 'Pausable: paused');
                });
        });
});
