const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers } = require('hardhat');
const TestHelper = require('./shared');
const SignHelper = require('./signature');
const { expectEvent, expectRevert, BN, time } = require('@openzeppelin/test-helpers');
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
describe('LuniverseGluwacoin - Transfer with signature, reserve and more', function () {
        before(async () => {
                gluwaInfo = await LuniverseGluwaCoinInfo();
                instance = await TestHelper.createContractInstance(ethers);
                owner = instance.owner;
                user1 = instance.user1;
                user2 = instance.user2
                user3 = instance.user3;
                provider = instance.provider;
        });
        beforeEach(async () => {
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

        describe('Reserve, Execute, Reservation and Reclaim', async function () {
                it('Test reserve() w/ signature', async () => {
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

                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
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
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(originalBalance.toNumber() - (amounToReserve + feeToPay));
                });

                it('Test reserve() w/ signature (executor is not Gluwa role)', async () => {
                        const isGluwa = await gluwaCoin.isGluwa(user2.address);
                        if (isGluwa) {
                                const input = await gluwaCoin.connect(owner).populateTransaction.removeGluwa(user2.address);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        
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

                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 2000);

                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, user2.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                user2.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(originalBalance.toNumber() - (amounToReserve + feeToPay));
                });

                it('Test execute()', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalReservedOf = await gluwaCoin.reservedOf(owner.address);
                        const executorBalance = await gluwaCoin.balanceOf(owner.address);
                        const reveiverBalance = await gluwaCoin.balanceOf(user1.address);
                        const feeCollectorBalance = await gluwaCoin.balanceOf(user3.address);

                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 2000);

                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        const executorAfterResBalance = await gluwaCoin.balanceOf(owner.address);
   
                        const inputExecute = await gluwaCoin.connect(owner).populateTransaction.execute(owner.address, nounce, { gasLimit: ethers.utils.hexlify(3000000), from: owner.address });     
                        const result = await TestHelper.txn(inputExecute, gluwaCoin.address, owner, ethers, provider);
                       
                        const executorNewBalance = await gluwaCoin.balanceOf(owner.address);
                        const receiverNewBalance = await gluwaCoin.balanceOf(user1.address);
                        const feeCollectorNewBalance = await gluwaCoin.balanceOf(user3.address);

                        const reservedOf = await gluwaCoin.reservedOf(owner.address);
                        /* console.log('\x1b[32m%s\x1b[0m', `
                                reservedOf: ${reservedOf}
                                executorBalance: ${executorBalance}
                                executorAfterResBalance: ${executorAfterResBalance}
                                executorNewBalance: ${executorNewBalance}
                                reveiverBalance: ${reveiverBalance}
                                receiverNewBalance: ${receiverNewBalance}
                                feeCollectorBalance: ${feeCollectorBalance}
                                feeCollectorNewBalance: ${feeCollectorNewBalance}`); */
                        expect(reservedOf.toNumber()).to.equal(originalReservedOf.toNumber());
                     //   expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(reveiverBalance.toNumber() + amounToReserve);
                });

                it('Test execute() (executor is not sender but has Gluwa role)', async () => {
                        const isGluwa = await gluwaCoin.isGluwa(user2.address);
                        if (!isGluwa) {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addGluwa(user2.address);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 5010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalReservedOf = await gluwaCoin.reservedOf(owner.address);
                        const reveiverBalance = await gluwaCoin.balanceOf(user1.address);

                        const executorBalance = await gluwaCoin.balanceOf(owner.address);

                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 2000);

                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, user2.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                user2.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);

                        const executorAfterResBalance = await gluwaCoin.balanceOf(owner.address);

                        const inputExecute = await gluwaCoin.connect(user2).populateTransaction.execute(owner.address, nounce, { from: user2.address });     
                        await TestHelper.checkResult(inputExecute, gluwaCoin.address, user2, ethers, provider, 0);

                        const reservedOf = await gluwaCoin.reservedOf(owner.address);

                        const executorNewBalance = await gluwaCoin.balanceOf(owner.address);
                        const receiverNewBalance = await gluwaCoin.balanceOf(user1.address);

                        /* console.log('\x1b[32m%s\x1b[0m', `
                                originalReservedOf: ${originalReservedOf}
                                reservedOf: ${reservedOf}
                                nounce: ${nounce}
                                user2.address: ${user2.address}
                                executorBalance: ${executorBalance}
                                executorAfterResBalance: ${executorAfterResBalance}
                                executorNewBalance: ${executorNewBalance}
                                reveiverBalance: ${reveiverBalance}
                                receiverNewBalance: ${receiverNewBalance}`); */

                        expect(reservedOf.toNumber()).to.equal(originalReservedOf.toNumber());
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(reveiverBalance.toNumber() + amounToReserve);
                });

                it('Test getReservation()', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 2000);

                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);

                        const getReservation = await gluwaCoin.getReservation(owner.address, nounce);
                        expect(getReservation['amount'].toNumber()).to.equal(amounToReserve);
                        expect(getReservation['fee'].toNumber()).to.equal(feeToPay);
                        expect(getReservation['recipient']).to.equal(user1.address);
                        expect(getReservation['executor']).to.equal(owner.address);
                        expect(getReservation['status']).to.equal(0);
                });

                it('Test reservedOf()', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalReservedOf = await gluwaCoin.reservedOf(owner.address);

                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 2000);

                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        const reservedOf = await gluwaCoin.reservedOf(owner.address);
                        
                        expect(reservedOf.toNumber()).to.equal(originalReservedOf.toNumber() + amounToReserve + feeToPay);
                });

                it('Test reclaim()', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalReservedOf = await gluwaCoin.reservedOf(owner.address);
                        const executorBalance = await gluwaCoin.balanceOf(owner.address);
                        const reveiverBalance = await gluwaCoin.balanceOf(user1.address);
                        const feeCollectorBalance = await gluwaCoin.balanceOf(user3.address);

                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 2000);

                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        const executorAfterResBalance = await gluwaCoin.balanceOf(owner.address);

                        const inputReclaim = await gluwaCoin.connect(owner).populateTransaction.reclaim(owner.address, nounce, { from: owner.address });     
                        await TestHelper.checkResult(inputReclaim, gluwaCoin.address, owner, ethers, provider, 0);

                       
                       const executorNewBalance = await gluwaCoin.balanceOf(owner.address);
                       const receiverNewBalance = await gluwaCoin.balanceOf(user1.address);
                       const feeCollectorNewBalance = await gluwaCoin.balanceOf(user3.address);

                        const reservedOf = await gluwaCoin.reservedOf(owner.address);
                       /* console.log('\x1b[32m%s\x1b[0m', `
                        reservedOf: ${reservedOf}
                        executorBalance: ${executorBalance}
                        executorAfterResBalance: ${executorAfterResBalance}
                        executorNewBalance: ${executorNewBalance}
                        reveiverBalance: ${reveiverBalance}
                        receiverNewBalance: ${receiverNewBalance}
                        feeCollectorBalance: ${feeCollectorBalance}
                        feeCollectorNewBalance: ${feeCollectorNewBalance}`); */
                        expect(reservedOf.toNumber()).to.equal(originalReservedOf.toNumber());
                });

                it('Test execute() on expired reservation', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 10);
                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        if (gluwaInfo.network == "hardhat") {
                                await TestHelper.mineBlocks(provider, 15);
                        } else {
                                for(let i = 1; i < 15; i++) {
                                        const randHashOwner = await ethers.utils.randomBytes(32);
                                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, i, owner.address);
                                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);
                                }
                        }
                    
                       let msg;
                       try {
                               const inputExecute = await gluwaCoin.connect(owner).populateTransaction.execute(owner.address, nounce, { from: owner.address });
                               msg = await TestHelper.checkResult(inputExecute, gluwaCoin.address, owner, ethers, provider, 0);
                       } catch(err) {
                               msg = 'ERC20Reservable: reservation has expired and cannot be executed';
                       }
                       expect(msg).to.equal('ERC20Reservable: reservation has expired and cannot be executed');
                });

                it('Test execute() from not sender || executor', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                    
                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 5);
                    
                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        if (gluwaInfo.network == "hardhat") {
                                await TestHelper.mineBlocks(provider, 15);
                        } else {
                                for(let i = 1; i < 15; i++) {
                                        const randHashOwner = await ethers.utils.randomBytes(32);
                                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, i, owner.address);
                                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);
                                }
                        }
                    
                        let msg;
                        try {
                                msg = await gluwaCoin.connect(user2).execute(owner.address, nounce, { from: user2.address });
                        } catch(err) {
                                msg = 'ERC20Reservable: this address is not authorized to execute this reservation';
                        }
                        expect(msg).to.equal('ERC20Reservable: this address is not authorized to execute this reservation');
                });

                it('Test reclaim() on expired reservation (but executor)', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                    
                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 5);
                    
                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                    
                        if (gluwaInfo.network == "hardhat") {
                                await TestHelper.mineBlocks(provider, 15);
                        } else {
                                for(let i = 1; i < 15; i++) {
                                        const randHashOwner = await ethers.utils.randomBytes(32);
                                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, i, owner.address);
                                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);
                                }
                        }
                        
                        const inputReclaim = await gluwaCoin.connect(owner).populateTransaction.reclaim(owner.address, nounce, { from: owner.address });     
                        await TestHelper.checkResult(inputReclaim, gluwaCoin.address, owner, ethers, provider, 0);
                    
                        let msg;
                        try {
                                msg = await gluwaCoin.connect(owner).execute(owner.address, nounce, { from: owner.address });
                        } catch(err) {
                                msg = 'ERC20Reservable: reservation has expired and cannot be executed';
                        }
                        expect(msg).to.equal('ERC20Reservable: reservation has expired and cannot be executed');
                });

                it('Test reclaim() on expired reservation (executor is not sender and not Gluwa role)', async () => {
                        const isGluwa = await gluwaCoin.isGluwa(user2.address);
                        if (isGluwa) {
                                const input = await gluwaCoin.connect(owner).populateTransaction.removeGluwa(user2.address);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        }

                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const executorBalance = await gluwaCoin.balanceOf(owner.address);
                        const reveiverBalance = await gluwaCoin.balanceOf(user1.address);
                        const feeCollectorBalance = await gluwaCoin.balanceOf(user3.address);

                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 5);

                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, user2.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                user2.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        const executorAfterResBalance = await gluwaCoin.balanceOf(owner.address);
                    
                        if (gluwaInfo.network == "hardhat") {
                                await TestHelper.mineBlocks(provider, 15);
                        } else {
                                for(let i = 1; i < 15; i++) {
                                        const randHashOwner = await ethers.utils.randomBytes(32);
                                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, i, owner.address);
                                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);
                                }
                        }

                        const inputReclaim = await gluwaCoin.connect(owner).populateTransaction.reclaim(owner.address, nounce, { from: owner.address });     
                        await TestHelper.checkResult(inputReclaim, gluwaCoin.address, owner, ethers, provider, 0);

                       
                       const executorNewBalance = await gluwaCoin.balanceOf(owner.address);
                       const receiverNewBalance = await gluwaCoin.balanceOf(user1.address);
                       const feeCollectorNewBalance = await gluwaCoin.balanceOf(user3.address);

                        const reservedOf = await gluwaCoin.reservedOf(owner.address);
                       /* console.log('\x1b[32m%s\x1b[0m', `
                        reservedOf: ${reservedOf}
                        executorBalance: ${executorBalance}
                        executorAfterResBalance: ${executorAfterResBalance}
                        executorNewBalance: ${executorNewBalance}
                        reveiverBalance: ${reveiverBalance}
                        receiverNewBalance: ${receiverNewBalance}
                        feeCollectorBalance: ${feeCollectorBalance}
                        feeCollectorNewBalance: ${feeCollectorNewBalance}`); */
                });

                it('Test reclaim() on expired reservation (not executor || sender)', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                    
                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 5);
                    
                        const signature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        let input = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                    
                        if (gluwaInfo.network == "hardhat") {
                                await TestHelper.mineBlocks(provider, 15);
                        } else {
                                for(let i = 1; i < 15; i++) {
                                        const randHashOwner = await ethers.utils.randomBytes(32);
                                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, i, owner.address);
                                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);
                                }
                        }
                        
                        let msg;
                        try {
                                msg = await gluwaCoin.connect(owner).reclaim(owner.address, nounce, { from: user2.address });
                        } catch(err) {
                                msg = 'ERC20Reservable: only the sender or the executor can reclaim the reservation back to the sender';
                        }
                        expect(msg).to.equal('ERC20Reservable: only the sender or the executor can reclaim the reservation back to the sender');
                });
        });
        
        describe('Transfer w/ signature', () => {
                it('It return a ChainID', async () => {
                        const chainId = await gluwaCoin.chainId();
                        expect(chainId).to.equal(gluwaInfo.ChainId);
                });

                it('Test transfer() with signature', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 3000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const giverBalance = await gluwaCoin.balanceOf(owner.address);
                        const reveiverBalance = await gluwaCoin.balanceOf(user1.address);

                        const amounToTransfer = 1000;
                        const feeToPay = 10;
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

                        const giverNewBalance = await gluwaCoin.balanceOf(owner.address);
                        const receiverNewBalance = await gluwaCoin.balanceOf(user1.address);
                       /* console.log('\x1b[32m%s\x1b[0m', `
                                giverBalance: ${giverBalance}
                                giverNewBalance: ${giverNewBalance}
                                reveiverBalance: ${reveiverBalance}
                                receiverNewBalance: ${receiverNewBalance}`); */
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(reveiverBalance.toNumber() + amounToTransfer);
                });
        });
        
        describe('Burn w/ signature', () => {
                it('Test burn() with signature', async () => {
                        const originalBalance = await gluwaCoin.balanceOf(owner.address);

                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 3000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const burnerBalance = await gluwaCoin.balanceOf(owner.address);

                        const amounToBurn = 1000;
                        const feeToPay = 100;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }

                        const signature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, amounToBurn, feeToPay, nounce);
                        let input = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                amounToBurn,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);

                        const burnerNewBalance = await gluwaCoin.balanceOf(owner.address);
                       /* console.log('\x1b[32m%s\x1b[0m', `
                                originalBalance: ${originalBalance}
                                burnerBalance: ${burnerBalance}
                                burnerNewBalance: ${burnerNewBalance}`); */
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(burnerBalance.toNumber() - (amounToBurn - feeToPay));
                });

                it('Test burn() with signature (only balance for burn, no balance for fee)', async () => {
                        const originalBalance = await gluwaCoin.balanceOf(owner.address);
                        
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const burnerBalance = await gluwaCoin.balanceOf(owner.address);

                        const amounToBurn = 1000;
                        const feeToPay = 100;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }

                        const signature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, amounToBurn, feeToPay, nounce);
                        let input = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                amounToBurn,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address });
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);

                        const burnerNewBalance = await gluwaCoin.balanceOf(owner.address);
                       /* console.log('\x1b[32m%s\x1b[0m', `
                                originalBalance: ${originalBalance}
                                burnerBalance: ${burnerBalance}
                                burnerNewBalance: ${burnerNewBalance}`); */
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(burnerBalance.toNumber() - (amounToBurn - feeToPay));
                });
        });
        
        describe('All Ethless transaction use _useNounce and verify nounce are not reused', () => {
                it('Test transfer(/w signature), burn(/w signature) and reserve(/w signature) with same nounce', async () => {
                        
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 5000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const burnerBalance = await gluwaCoin.balanceOf(owner.address);

                        const amounToTransfer = 1000;
                        const amounToBurn = 1000;
                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 2000);

                        const transferSignature = SignHelper.signTransfer(3, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, amounToTransfer, feeToPay, nounce);
                        const inputTransfer = await gluwaCoin.connect(owner).populateTransaction['transfer(address,address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                user1.address,
                                amounToTransfer,
                                feeToPay,
                                nounce, 
                                transferSignature, { from: owner.address });
                        await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);

                        const burnSignature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, amounToBurn, feeToPay, nounce);
                        const inputBurn = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                amounToBurn,
                                feeToPay,
                                nounce, 
                                burnSignature, { from: owner.address });
                        await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);

                        const reserveSignature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        const inputReserve = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                reserveSignature, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        await TestHelper.checkResult(inputReserve, gluwaCoin.address, owner, ethers, provider, 0);

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(burnerBalance.toNumber() - amounToTransfer - amounToBurn - amounToReserve);
                });
                it('Test transfer(/w signature), burn(/w signature) and reserve(/w signature) with same nounce (2x each)', async () => {
                        
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 5000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const burnerBalance = await gluwaCoin.balanceOf(owner.address);

                        const amounToTransfer = 1000;
                        const amounToBurn = 1000;
                        const amounToReserve = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 2000);

                        const transferSignature = SignHelper.signTransfer(3, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, amounToTransfer, feeToPay, nounce);
                        const inputTransfer = await gluwaCoin.connect(owner).populateTransaction['transfer(address,address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                user1.address,
                                amounToTransfer,
                                feeToPay,
                                nounce, 
                                transferSignature, { from: owner.address });
                        await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);

                        let msg1;
                        try {
                                msg1 = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg1 = 'ETHless: the nonce has already been used for this address';
                        }

                        const burnSignature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, amounToBurn, feeToPay, nounce);
                        const inputBurn = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                amounToBurn,
                                feeToPay,
                                nounce, 
                                burnSignature, { from: owner.address });
                        await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);

                        let msg2;
                        try {
                                msg2 = await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg2 = 'ETHless: the nonce has already been used for this address';
                        }

                        const reserveSignature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        const inputReserve = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                reserveSignature, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        await TestHelper.checkResult(inputReserve, gluwaCoin.address, owner, ethers, provider, 0);

                        let msg3;
                        try {
                                msg3 = await TestHelper.checkResult(inputReserve, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg3 = 'ETHless: the nonce has already been used for this address';
                        }

                        expect(msg1).to.equal('ETHless: the nonce has already been used for this address');
                        expect(msg2).to.equal('ETHless: the nonce has already been used for this address');
                        expect(msg3).to.equal('ETHless: the nonce has already been used for this address');
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(burnerBalance.toNumber() - amounToTransfer - amounToBurn - amounToReserve);
                });

                it('Test transfer(w/ signature) x 2 with same nounce', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 3000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalBalance = await gluwaCoin.balanceOf(owner.address);

                        const amounToTransfer = 1000;
                        const feeToPay = 100;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }

                        const transferSignature = SignHelper.signTransfer(3, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, amounToTransfer, feeToPay, nounce);
                        const inputTransfer = await gluwaCoin.connect(owner).populateTransaction['transfer(address,address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                user1.address,
                                amounToTransfer,
                                feeToPay,
                                nounce, 
                                transferSignature, { from: owner.address });
                        await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);

                        let msg;
                        try {
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'ETHless: the nonce has already been used for this address';
                        }

                        expect(msg).to.equal('ETHless: the nonce has already been used for this address');
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(originalBalance.toNumber() - (amounToTransfer));
                });

                it('Test burn(w/ signature) x 2 with same nounce', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 3000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalBalance = await gluwaCoin.balanceOf(owner.address);

                        const amounToBurn = 1000;
                        const feeToPay = 100;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }

                        const burnSignature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, amounToBurn, feeToPay, nounce);
                        const inputBurn = await gluwaCoin.connect(owner).populateTransaction['burn(address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                amounToBurn,
                                feeToPay,
                                nounce, 
                                burnSignature, { from: owner.address });
                        await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);

                        let msg;
                        try {
                                msg = await TestHelper.checkResult(inputBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'ETHless: the nonce has already been used for this address';
                        }

                        expect(msg).to.equal('ETHless: the nonce has already been used for this address');
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(originalBalance.toNumber() - (amounToBurn - feeToPay));
                });

                it('Test reserve(w/ signature) x 2 with same nounce', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 3000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalBalance = await gluwaCoin.balanceOf(owner.address);

                        const amounToReserve = 1000;
                        const feeToPay = 100;
                        const nounce = Date.now();
                        let ownerKey = gluwaInfo.OwnerKey;
                        if(ownerKey.substring(0,2) !== '0x') {
                                ownerKey = '0x' + ownerKey;
                        }
                        const blockNumber = await provider.getBlockNumber();
                        const expirationBlock = (blockNumber + 2000);

                        const reserveSignature = SignHelper.signReserve(4, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, owner.address, amounToReserve, feeToPay, nounce, expirationBlock);
                        const inputReserve = await gluwaCoin.connect(owner).populateTransaction['reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'](
                                owner.address, 
                                user1.address, 
                                owner.address, 
                                amounToReserve, 
                                feeToPay, 
                                nounce, 
                                expirationBlock, 
                                reserveSignature, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        await TestHelper.checkResult(inputReserve, gluwaCoin.address, owner, ethers, provider, 0);        
                        
                        let msg;
                        try {
                                msg = await TestHelper.checkResult(inputReserve, gluwaCoin.address, owner, ethers, provider, 0);
                        } catch(err) {
                                msg = 'ETHless: the nonce has already been used for this address';
                        }

                        expect(msg).to.equal('ETHless: the nonce has already been used for this address');
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(originalBalance.toNumber() - (amounToReserve + feeToPay));
                });
        });

        describe('Before upgrade', () => {
                it('Confirm Token balance', async () => {
                        const balance = await gluwaCoin.balanceOf(owner.address);
                        if(balance > 0) {
                                const inputToBurn = await gluwaCoin.connect(owner).populateTransaction['burn(uint256)'](balance.toNumber());
                                await TestHelper.checkResult(inputToBurn, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        const newBalance = await gluwaCoin.balanceOf(owner.address);
                       /* console.log('\x1b[32m%s\x1b[0m', `
                                balance: ${balance}
                                newBalance: ${newBalance}`); */
                        expect(newBalance.toNumber()).to.equal((await gluwaCoin.balanceOf(owner.address)).toNumber());
                });
        });
});
