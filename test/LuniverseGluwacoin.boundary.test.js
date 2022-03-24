const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers } = require('hardhat');
const TestHelper = require('./shared');
const SignHelper = require('./signature');
const Chance = require('chance');
const LuniverseGluwaCoinInfo = require('./upgradeability/LuniverseGluwaCoinInfo');
use(solidity);

var owner;
var user1;
var user2;
var gluwaCoin;
var gluwaInfo;
var provider;
var zeroAddress = "0x0000000000000000000000000000000000000000";

/*
 * Test `LuniverseGluwacoin`
 */
describe('LuniverseGluwacoin - Boundary test', function () {
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
        });

        describe('Test floating point on different fn()', () => {
                it('Test mint() w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ fixed: 7 });

                        let msg;
                        try {
                                const randHashOwner = await ethers.utils.randomBytes(32);
                                const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, amount, owner.address);
                                await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 1);
        
                                const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                                await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 1);
        
                                const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                                await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 1);

                                const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                                await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no floating point');
                });
                it('Test burn() w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ min: 0, max: 100, fixed: 7 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 100, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputBurn = await gluwaCoin.connect(owner).populateTransaction['burn(uint256)'](amount);
                                msg = await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(100);
                        expect(msg).to.equal('no floating point');
                });
                it('Test burn(w/ signature) w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ min: 0, max: 100, fixed: 7 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 110, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        
                        let msg;
                        try {
                                const signature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, amount, feeToPay, nounce);
                                let input = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                        owner.address,
                                        amount,
                                        feeToPay,
                                        nounce, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(110);
                        expect(msg).to.equal('no floating point');
                });
                it('Test burnFrom() w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ min: 0, max: 100, fixed: 7 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 100, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 100);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);
                        let msg;
                        try {
                                const inputBurn = await gluwaCoin.connect(owner).populateTransaction.burnFrom(user1.address, amount);
                                msg = await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(100);
                        expect(msg).to.equal('no floating point');
                });
                it('Test transfer() w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ min: 0, max: 1000, fixed: 7 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction['transfer(address,uint256)'](user1.address, amount, { from: owner.address });
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(1000);
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no floating point');
                });
                it('Test transferFrom() w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ min: 0, max: 1000, fixed: 7 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 1000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);

                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction.transferFrom(user1.address, user2.address, amount);
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(1000);
                        expect((await gluwaCoin.balanceOf(user2.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no floating point');
                });
                it('Test transfer(w/ signature) w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ min: 0, max: 1000, fixed: 7 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }

                        let msg;
                        try {
                                const signature = SignHelper.signTransfer(3, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, amount, feeToPay, nounce);
                                let input = await gluwaCoin.connect(owner).populateTransaction['transfer(address,address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                user1.address,
                                amount,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(1010);
                        expect(msg).to.equal('no floating point');
                });
                it('Test reserve(w/ signature) w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ min: 0, max: 1000, fixed: 7 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalBalance = await gluwaCoin.balanceOf(owner.address);

                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.blockNumber;
                        const expirationBlock = (blockNumber + 2000);

                        let msg;
                        try {
                                const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amount, feeToPay, nounce, expirationBlock);
                                let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                        owner.address, 
                                        user1.address, 
                                        owner.address, 
                                        amount, 
                                        feeToPay, 
                                        nounce, 
                                        expirationBlock, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(1010);
                        expect(msg).to.equal('no floating point');
                });
                it('Test approve() w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ fixed: 7 });
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(0);
                        expect(msg).to.equal('no floating point');
                });
                it('Test increaseAllowance() w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ fixed: 7 });
                        const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 1000);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputIncreaseAllowance = await gluwaCoin.connect(owner).populateTransaction.increaseAllowance(gluwaCoin.address, chance);
                                msg = await TestHelper.checkResult(inputIncreaseAllowance, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(1000);
                        expect(msg).to.equal('no floating point');
                });
                it('Test decreaseAllowance() w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ min: 0, max: 100, fixed: 7 });
                        const inputApprove = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 1000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.decreaseAllowance(gluwaCoin.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(1000);
                        expect(msg).to.equal('no floating point');
                });
                it('Test addGluwa() w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ fixed: 7 });
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addGluwa(user1.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.be.false;
                        expect(msg).to.equal('no floating point');
                });
                it('Test removeGluwa() w/ floating point', async () => {
                        const chance = new Chance;
                        const amount = chance.floating({ fixed: 7 });
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.removeGluwa(owner.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no floating point';
                        }
                        expect(await gluwaCoin.isLuniverse(owner.address)).to.be.true;
                        expect(msg).to.equal('no floating point');
                });
        });

        describe('Test negative number on different fn()', () => {
                it('Test mint() w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        
                        const randHashOwner = await ethers.utils.randomBytes(32);

                        let msg;
                        try {
                                const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, amount, owner.address);
                                await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 1);
        
                                const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                                await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 1);
        
                                const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                                await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 1);

                                const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                                await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no negative number');
                });
                it('Test burn() w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputBurn = await gluwaCoin.connect(owner).populateTransaction['burn(uint256)'](amount);
                                msg = await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no negative number');
                });
                it('Test burn(w/ signature) w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        let msg;
                        try {
                                const signature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, amount, feeToPay, nounce);        
                                let input = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                        owner.address,
                                        amount,
                                        feeToPay,
                                        nounce, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10010);
                        expect(msg).to.equal('no negative number');
                });
                it('Test burnFrom() w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);
                        let msg;
                        try {
                                const inputBurn = await gluwaCoin.connect(owner).populateTransaction.burnFrom(user1.address, amount);
                                msg = await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no negative number');
                });
                it('Test transfer() w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction['transfer(address,uint256)'](user1.address, amount, { from: owner.address });
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no negative number');
                });
                it('Test transferFrom() w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);

                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction.transferFrom(user1.address, user2.address, amount);
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(10000);
                        expect((await gluwaCoin.balanceOf(user2.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no negative number');
                });
                it('Test transfer(w/ signature) w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }

                        let msg;
                        try {
                                const signature = SignHelper.signTransfer(3, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, amount, feeToPay, nounce);
                                let input = await gluwaCoin.connect(owner).populateTransaction['transfer(address,address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                user1.address,
                                amount,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no negative number');
                });
                it('Test reserve(w/ signature) w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalBalance = await gluwaCoin.balanceOf(owner.address);

                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.blockNumber;
                        const expirationBlock = (blockNumber + 2000);

                        let msg;
                        try {
                                const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amount, feeToPay, nounce, expirationBlock);
                                let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                        owner.address, 
                                        user1.address, 
                                        owner.address, 
                                        amount, 
                                        feeToPay, 
                                        nounce, 
                                        expirationBlock, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10010);
                        expect(msg).to.equal('no negative number');
                });
                it('Test approve() w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(0);
                        expect(msg).to.equal('no negative number');
                });
                it('Test increaseAllowance() w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 10000);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputIncreaseAllowance = await gluwaCoin.connect(owner).populateTransaction.increaseAllowance(gluwaCoin.address, amount);
                                msg = await TestHelper.checkResult(inputIncreaseAllowance, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(10000);
                        expect(msg).to.equal('no negative number');
                });
                it('Test decreaseAllowance() w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        const inputApprove = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.decreaseAllowance(gluwaCoin.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(10000);
                        expect(msg).to.equal('no negative number');
                });
                it('Test addGluwa() w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addGluwa(user1.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.be.false;
                        expect(await gluwaCoin.isGluwa(user1.address)).to.be.false;
                        expect(msg).to.equal('no negative number');
                });
                it('Test removeGluwa() w/ negative number', async () => {
                        const chance = new Chance;
                        const amount = chance.integer({min: -10000, max: -1});
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.removeGluwa(owner.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no negative number';
                        }
                        expect(await gluwaCoin.isLuniverse(owner.address)).to.be.true;
                        expect(await gluwaCoin.isGluwa(owner.address)).to.be.true;
                        expect(msg).to.equal('no negative number');
                });
        });

        describe('Test zero(0) number on different fn()', () => {
                it('Test mint() w/ zero(0) number', async () => {
                        const amount = 0;
                        
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, amount, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(0);
                });
                it('Test burn() w/ zero(0) number', async () => {
                        const amount = 0;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        const inputBurn = await gluwaCoin.connect(owner).populateTransaction['burn(uint256)'](amount);
                        await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                });
                it('Test burn(w/ signature) w/ zero(0) number', async () => {
                        const amount = 0;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        
                        let msg;
                        try {
                                const signature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, amount, feeToPay, nounce);
                                let input = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                        owner.address,
                                        amount,
                                        feeToPay,
                                        nounce, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'ERC20: burn amount exceeds balance';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('ERC20: burn amount exceeds balance');
                });
                it('Test burnFrom() w/ zero(0) number', async () => {
                        const amount = 0;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
            
                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);
                        const inputBurn = await gluwaCoin.connect(owner).populateTransaction.burnFrom(user1.address, amount);
                        await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(10000);
                });
                it('Test transfer() w/ zero(0) number', async () => {
                        const amount = 0;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
            
                        const inputTransfer = await gluwaCoin.connect(owner).populateTransaction['transfer(address,uint256)'](user1.address, amount, { from: owner.address });
                        await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(0);
                });
                it('Test transferFrom() w/ zero(0) number', async () => {
                        const amount = 0;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
            
                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);
            
                        const inputTransfer = await gluwaCoin.connect(owner).populateTransaction.transferFrom(user1.address, user2.address, amount);
                        await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(10000);
                        expect((await gluwaCoin.balanceOf(user2.address)).toNumber()).to.equal(0);
                });
                it('Test transfer(w/ signature) w/ zero(0) number', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const amounToTransfer = 0;
                        const feeToPay = 0;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }

                        const signature = SignHelper.signTransfer(3, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, amounToTransfer, feeToPay, nounce);
                        let input = await gluwaCoin.connect(owner).populateTransaction['transfer(address,address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                user1.address,
                                amounToTransfer,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                });
                it('Test reserve(w/ signature) w/ zero(0) number', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const amounToReserve = 0;
                        const feeToPay = 0;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.blockNumber;
                        const expirationBlock = (blockNumber + 2000);

                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        const input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                });
                it('Test approve() w/ zero(0) number', async () => {
                        const amount = 0;
                        const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, amount);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(0);
                });
                it('Test increaseAllowance() w/ zero(0) number', async () => {
                        const amount = 0;
                        const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 10000);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        const inputIncreaseAllowance = await gluwaCoin.connect(owner).populateTransaction.increaseAllowance(gluwaCoin.address, amount);
                        await TestHelper.checkResult(inputIncreaseAllowance, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(10000);
                });
                it('Test decreaseAllowance() w/ zero(0) number', async () => {
                        const amount = 0;
                        const inputAprove = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 10000);
                        await TestHelper.checkResult(inputAprove, gluwaCoin.address, owner, ethers, provider, 0);
                        const input = await gluwaCoin.connect(owner).populateTransaction.decreaseAllowance(gluwaCoin.address, amount);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(10000);
                });
        });

        describe('Test overflow on different fn()', () => {
                it('Test mint() w/ overflow', async () => {
                        const amount = 2**256;
                        
                        const randHashOwner = await ethers.utils.randomBytes(32);

                        let msg;
                        try {
                                const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, amount, owner.address);
                                await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 1);
        
                                const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                                await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 1);
        
                                const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                                await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 1);

                                const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                                await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no overflow');
                });
                it('Test burn() w/ overflow', async () => {
                        const amount = 2**256;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputBurn = await gluwaCoin.connect(owner).populateTransaction['burn(uint256)'](amount);
                                msg = await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no overflow');
                });
                it('Test burn(w/ signature) w/ overflow', async () => {
                        const amount = 2**256;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        let msg;
                        try {
                                const signature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, amount, feeToPay, nounce);        
                                let input = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                        owner.address,
                                        amount,
                                        feeToPay,
                                        nounce, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no overflow');
                });
                it('Test burnFrom() w/ overflow', async () => {
                        const amount = 2**256;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
            
                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);
                        let msg;
                        try {
                                const inputBurn = await gluwaCoin.connect(owner).populateTransaction.burnFrom(user1.address, amount);
                                msg = await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no overflow');
                });
                it('Test transfer() w/ overflow', async () => {
                        const amount = 2**256;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
            
                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction['transfer(address,uint256)'](user1.address, amount, { from: owner.address });
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no overflow');
                });
                it('Test transferFrom() w/ overflow', async () => {
                        const amount = 2**256;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
            
                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);
            
                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction.transferFrom(user1.address, user2.address, amount);
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(10000);
                        expect((await gluwaCoin.balanceOf(user2.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no overflow');
                });
                it('Test transfer(w/ signature) w/ overflow', async () => {
                        const amount = 2**256;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }

                        let msg;
                        try {
                                const signature = SignHelper.signTransfer(3, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, amount, feeToPay, nounce);
                                let input = await gluwaCoin.connect(owner).populateTransaction['transfer(address,address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                user1.address,
                                amount,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no overflow');
                });
                it('Test reserve(w/ signature) w/ overflow', async () => {
                        const amount = 2**256;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalBalance = await gluwaCoin.balanceOf(owner.address);

                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.blockNumber;
                        const expirationBlock = (blockNumber + 2000);

                        let msg;
                        try {
                                const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amount, feeToPay, nounce, expirationBlock);
                                let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                        owner.address, 
                                        user1.address, 
                                        owner.address, 
                                        amount, 
                                        feeToPay, 
                                        nounce, 
                                        expirationBlock, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10010);
                        expect(msg).to.equal('no overflow');
                });
                it('Test approve() w/ overflow', async () => {
                        const amount = 2**256;
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(0);
                        expect(msg).to.equal('no overflow');
                });
                it('Test increaseAllowance() w/ overflow', async () => {
                        const amount = 2**256;
                        const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 10000);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputIncreaseAllowance = await gluwaCoin.connect(owner).populateTransaction.increaseAllowance(gluwaCoin.address, amount);
                                msg = await TestHelper.checkResult(inputIncreaseAllowance, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(10000);
                        expect(msg).to.equal('no overflow');
                });
                it('Test decreaseAllowance() w/ overflow', async () => {
                        const amount = 2**256;
                        const inputApprove = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.decreaseAllowance(gluwaCoin.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(10000);
                        expect(msg).to.equal('no overflow');
                });
                it('Test addGluwa() w/ overflow', async () => {
                        const amount = 2**256;
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addGluwa(user1.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.be.false;
                        expect(await gluwaCoin.isGluwa(user1.address)).to.be.false;
                        expect(msg).to.equal('no overflow');
                });
                it('Test removeGluwa() w/ overflow', async () => {
                        const amount = 2**256;
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.removeGluwa(owner.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no overflow';
                        }
                        expect(await gluwaCoin.isLuniverse(owner.address)).to.be.true;
                        expect(await gluwaCoin.isGluwa(owner.address)).to.be.true;
                        expect(msg).to.equal('no overflow');
                });
        });

        describe('Test NaN on different fn()', () => {
                it('Test mint() w/ NaN', async () => {
                        const amount = NaN;
                        const randHashOwner = await ethers.utils.randomBytes(32);

                        let msg;
                        try {
                                const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, amount, owner.address);
                                await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 1);
        
                                const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                                await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 1);
        
                                const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                                await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 1);

                                const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                                await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no NaN');
                });
                it('Test burn() w/ NaN', async () => {
                        const amount = NaN;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputBurn = await gluwaCoin.connect(owner).populateTransaction['burn(uint256)'](amount);
                                await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no NaN');
                });
                it('Test burn(w/ signature) w/ NaN', async () => {
                        const amount = NaN;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        
                        let msg;
                        try {
                                const signature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, amount, feeToPay, nounce);
                                let input = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                        owner.address,
                                        amount,
                                        feeToPay,
                                        nounce, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no NaN');
                });
                it('Test burnFrom() w/ NaN', async () => {
                        const amount = NaN;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
            
                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);
                        let msg;
                        try {
                                const inputBurn = await gluwaCoin.connect(owner).populateTransaction.burnFrom(user1.address, amount);
                                await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no NaN');
                });
                it('Test transfer() w/ NaN', async () => {
                        const amount = NaN;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction['transfer(address,uint256)'](user1.address, amount, { from: owner.address });
                                await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no NaN');
                });
                it('Test transferFrom() w/ NaN', async () => {
                        const amount = NaN;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
            
                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);
                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction.transferFrom(user1.address, user2.address, amount);
                                await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(10000);
                        expect((await gluwaCoin.balanceOf(user2.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no NaN');
                });
                it('Test transfer(w/ signature) w/ NaN', async () => {
                        const amount = NaN;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }

                        let msg;
                        try {
                                const signature = SignHelper.signTransfer(3, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, amount, feeToPay, nounce);
                                let input = await gluwaCoin.connect(owner).populateTransaction['transfer(address,address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                user1.address,
                                amount,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no NaN');
                });
                it('Test reserve(w/ signature) w/ NaN', async () => {
                        const amount = NaN;
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalBalance = await gluwaCoin.balanceOf(owner.address);

                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.blockNumber;
                        const expirationBlock = (blockNumber + 2000);

                        let msg;
                        try {
                                const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amount, feeToPay, nounce, expirationBlock);
                                let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                        owner.address, 
                                        user1.address, 
                                        owner.address, 
                                        amount, 
                                        feeToPay, 
                                        nounce, 
                                        expirationBlock, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10010);
                        expect(msg).to.equal('no NaN');
                });
                it('Test approve() w/ NaN', async () => {
                        const amount = NaN;
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, amount);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(0);
                        expect(msg).to.equal('no NaN');
                });
                it('Test increaseAllowance() w/ NaN', async () => {
                        const amount = NaN;
                        const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 10000);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputIncreaseAllowance = await gluwaCoin.connect(owner).populateTransaction.increaseAllowance(gluwaCoin.address, amount);
                                await TestHelper.checkResult(inputIncreaseAllowance, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(10000);
                        expect(msg).to.equal('no NaN');
                });
                it('Test decreaseAllowance() w/ NaN', async () => {
                        const amount = NaN;
                        const inputAprove = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 10000);
                        await TestHelper.checkResult(inputAprove, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.decreaseAllowance(gluwaCoin.address, amount);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(10000);
                        expect(msg).to.equal('no NaN');
                });
                it('Test addGluwa() w/ NaN', async () => {
                        const amount = NaN;
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addGluwa(user1.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.be.false;
                        expect(await gluwaCoin.isGluwa(user1.address)).to.be.false;
                        expect(msg).to.equal('no NaN');
                });
                it('Test removeGluwa() w/ NaN', async () => {
                        const amount = NaN;
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.removeGluwa(owner.address, amount);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no NaN';
                        }
                        expect(await gluwaCoin.isLuniverse(owner.address)).to.be.true;
                        expect(await gluwaCoin.isGluwa(owner.address)).to.be.true;
                        expect(msg).to.equal('no NaN');
                });
        });

        describe('Test empty string on different fn()', () => {
                it('Test mint() w/ empty string', async () => {
                        const emptyString = '';
                        
                        const randHashOwner = await ethers.utils.randomBytes(32);

                        let msg;
                        try {
                                const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, emptyString, owner.address);
                                await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 1);
        
                                const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                                await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 1);
        
                                const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                                await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 1);

                                const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                                await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no empty string');
                });
                it('Test burn() w/ empty string', async () => {
                        const emptyString = '';
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputBurn = await gluwaCoin.connect(owner).populateTransaction['burn(uint256)'](emptyString);
                                msg = await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no empty string');
                });
                it('Test burn(w/ signature) w/ empty string', async () => {
                        const emptyString = '';
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        
                        let msg;
                        try {
                                const signature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, emptyString, feeToPay, nounce);
                                let input = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                        owner.address,
                                        emptyString,
                                        feeToPay,
                                        nounce, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no empty string');
                });
                it('Test burnFrom() w/ empty string', async () => {
                        const emptyString = '';
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
            
                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);
                        let msg;
                        try {
                                const inputBurn = await gluwaCoin.connect(owner).populateTransaction.burnFrom(user1.address, emptyString);
                                msg = await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no empty string');
                });
                it('Test transfer() w/ empty string', async () => {
                        const emptyString = '';
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
            
                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction['transfer(address,uint256)'](user1.address, emptyString, { from: owner.address });
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no empty string');
                });
                it('Test transferFrom() w/ empty string', async () => {
                        const emptyString = '';
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
            
                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);
            
                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction.transferFrom(user1.address, user2.address, emptyString);
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(10000);
                        expect((await gluwaCoin.balanceOf(user2.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no empty string');
                });
                it('Test transfer(w/ signature) w/ empty string', async () => {
                        const emptyString = '';
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }

                        let msg;
                        try {
                                const signature = SignHelper.signTransfer(3, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, emptyString, feeToPay, nounce);
                                let input = await gluwaCoin.connect(owner).populateTransaction['transfer(address,address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                user1.address,
                                emptyString,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no empty string');
                });
                it('Test reserve(w/ signature) w/ empty string', async () => {
                        const emptyString = '';
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalBalance = await gluwaCoin.balanceOf(owner.address);

                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.blockNumber;
                        const expirationBlock = (blockNumber + 2000);

                        let msg;
                        try {
                                const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, emptyString, feeToPay, nounce, expirationBlock);
                                let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                        owner.address, 
                                        user1.address, 
                                        owner.address, 
                                        emptyString, 
                                        feeToPay, 
                                        nounce, 
                                        expirationBlock, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10010);
                        expect(msg).to.equal('no empty string');
                });
                it('Test approve() w/ empty string', async () => {
                        const emptyString = '';
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, emptyString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(0);
                        expect(msg).to.equal('no empty string');
                });
                it('Test increaseAllowance() w/ empty string', async () => {
                        const emptyString = '';
                        const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 10000);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputIncreaseAllowance = await gluwaCoin.connect(owner).populateTransaction.increaseAllowance(gluwaCoin.address, emptyString);
                                msg = await TestHelper.checkResult(inputIncreaseAllowance, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(10000);
                        expect(msg).to.equal('no empty string');
                });
                it('Test decreaseAllowance() w/ empty string', async () => {
                        const emptyString = '';
                        const inputApprove = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.decreaseAllowance(gluwaCoin.address, emptyString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(10000);
                        expect(msg).to.equal('no empty string');
                });
                it('Test addGluwa() w/ empty string', async () => {
                        const emptyString = '';
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addGluwa(user1.address, emptyString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.be.false;
                        expect(await gluwaCoin.isGluwa(user1.address)).to.be.false;
                        expect(msg).to.equal('no empty string');
                });
                it('Test removeGluwa() w/ empty string', async () => {
                        const emptyString = '';
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.removeGluwa(owner.address, emptyString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect(await gluwaCoin.isLuniverse(owner.address)).to.be.true;
                        expect(await gluwaCoin.isGluwa(owner.address)).to.be.true;
                        expect(msg).to.equal('no empty string');
                });
                it('Test addLuniverse() w/ empty string', async () => {
                        const emptyString = '';
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addLuniverse(emptyString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect(msg).to.equal('no empty string');
                });
                it('Test addLuniverse() w/ empty string', async () => {
                        const emptyString = '';
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addLuniverse(emptyString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect(msg).to.equal('no empty string');
                });
                it('Test removeLuniverse() w/ empty string', async () => {
                        const emptyString = '';
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.removeLuniverse(emptyString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no empty string';
                        }
                        expect(msg).to.equal('no empty string');
                });
        });
        describe('Test random string on different fn()', () => {
                it('Test mint() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        
                        const randHashOwner = await ethers.utils.randomBytes(32);

                        let msg;
                        try {
                                const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, randomString, owner.address);
                                await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 1);
        
                                const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                                await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 1);
        
                                const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                                await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 1);
                                
                                const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                                await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no random string');
                });
                it('Test burn() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputBurn = await gluwaCoin.connect(owner).populateTransaction['burn(uint256)'](randomString);
                                msg = await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no random string');
                });
                it('Test burn(w/ signature) w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        
                        let msg;
                        try {
                                const signature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, randomString, feeToPay, nounce);
                                let input = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                        owner.address,
                                        randomString,
                                        feeToPay,
                                        nounce, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no random string');
                });
                it('Test burnFrom() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);
                        let msg;
                        try {
                                const inputBurn = await gluwaCoin.connect(owner).populateTransaction.burnFrom(user1.address, randomString);
                                msg = await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no random string');
                });
                it('Test transfer() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction['transfer(address,uint256)'](user1.address, randomString, { from: owner.address });
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no random string');
                });
                it('Test transferFrom() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputApprove = await gluwaCoin.connect(user1).populateTransaction.approve(owner.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, user1, ethers, provider, 0);

                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction.transferFrom(user1.address, user2.address, randomString);
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(10000);
                        expect((await gluwaCoin.balanceOf(user2.address)).toNumber()).to.equal(0);
                        expect(msg).to.equal('no random string');
                });
                it('Test transfer(w/ signature) w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }

                        let msg;
                        try {
                                const signature = SignHelper.signTransfer(3, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, randomString, feeToPay, nounce);
                                let input = await gluwaCoin.connect(owner).populateTransaction['transfer(address,address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                user1.address,
                                randomString,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10000);
                        expect(msg).to.equal('no random string');
                });
                it('Test reserve(w/ signature) w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 10010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalBalance = await gluwaCoin.balanceOf(owner.address);

                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.blockNumber;
                        const expirationBlock = (blockNumber + 2000);

                        let msg;
                        try {
                                const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, randomString, feeToPay, nounce, expirationBlock);
                                let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                        owner.address, 
                                        user1.address, 
                                        owner.address, 
                                        randomString, 
                                        feeToPay, 
                                        nounce, 
                                        expirationBlock, 
                                        signature, { from: owner.address });
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(10010);
                        expect(msg).to.equal('no random string');
                });
                it('Test approve() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, randomString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(0);
                        expect(msg).to.equal('no random string');
                });
                it('Test increaseAllowance() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        const input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 10000);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputIncreaseAllowance = await gluwaCoin.connect(owner).populateTransaction.increaseAllowance(gluwaCoin.address, randomString);
                                msg = await TestHelper.checkResult(inputIncreaseAllowance, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(10000);
                        expect(msg).to.equal('no random string');
                });
                it('Test decreaseAllowance() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        const inputApprove = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 10000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.decreaseAllowance(gluwaCoin.address, randomString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(10000);
                        expect(msg).to.equal('no random string');
                });
                it('Test addGluwa() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addGluwa(user1.address, randomString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.be.false;
                        expect(await gluwaCoin.isGluwa(user1.address)).to.be.false;
                        expect(msg).to.equal('no random string');
                });
                it('Test removeGluwa() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.removeGluwa(owner.address, randomString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect(await gluwaCoin.isLuniverse(owner.address)).to.be.true;
                        expect(await gluwaCoin.isGluwa(owner.address)).to.be.true;
                        expect(msg).to.equal('no random string');
                });
                it('Test addLuniverse() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addLuniverse(randomString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect(msg).to.equal('no random string');
                });
                it('Test addLuniverse() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addLuniverse(randomString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect(msg).to.equal('no random string');
                });
                it('Test removeLuniverse() w/ random string', async () => {
                        var chance = new Chance;
                        const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
                        let msg;
                        try {
                                const input = await gluwaCoin.connect(owner).populateTransaction.removeLuniverse(randomString);
                                msg = await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'no random string';
                        }
                        expect(msg).to.equal('no random string');
                });
        });
});
