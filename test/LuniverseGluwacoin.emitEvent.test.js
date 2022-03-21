const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers } = require('hardhat');
const TestHelper = require('./shared');
const SignHelper = require('./signature');
const Chance = require('chance');
const { expectEvent } = require('@openzeppelin/test-helpers');
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
const PauserRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PAUSER_ROLE"));
const LuniverseRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LUNIVERSE_ROLE"));
const GluwaRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GLUWA_ROLE"));

/*
 * Test `LuniverseGluwacoin`
 */
describe('LuniverseGluwacoin - Events', function () {
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

        describe('Test that function emit event', () => {
                it('Test mint() emit Transfer & Mint event', async ()=> {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const txn = await gluwaCoin.mint(randHashOwner, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "Mint").withArgs(owner.address, '1000');
                        await expect(txn).to.emit(gluwaCoin, "Transfer").withArgs(zeroAddress, owner.address, '1000');
                        // Confirm order & events count
                        await expect(receipt.events[0].event).to.be.equal("Mint");
                        await expect(receipt.events[1].event).to.be.equal("Transfer");
                        await expect(receipt.events.length).to.be.equal(2);
                });

                it('Test burn() emit Burnt & Transfer event', async ()=> {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const txn = await gluwaCoin['burn(uint256)'](1000, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "Transfer").withArgs(owner.address, zeroAddress, '1000');
                        await expect(txn).to.emit(gluwaCoin, "Burnt").withArgs(owner.address, '1000');
                        // Confirm order & events count
                        await expect(receipt.events[0].event).to.be.equal("Burnt");
                        await expect(receipt.events[1].event).to.be.equal("Transfer");
                        await expect(receipt.events.length).to.be.equal(2);
                });

                it('Test burnFrom() emit Burnt, Transfer & Approval event', async ()=> {
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

                        const txn = await gluwaCoin.burnFrom(user1.address, 1000, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "Transfer").withArgs(user1.address, zeroAddress, '1000');
                        await expect(txn).to.emit(gluwaCoin, "Burnt").withArgs(user1.address, '1000');
                        await expect(txn).to.emit(gluwaCoin, "Approval").withArgs(user1.address, owner.address, '0');
                        // Confirm order & events count
                        await expect(receipt.events[0].event).to.be.equal("Burnt");
                        await expect(receipt.events[1].event).to.be.equal("Transfer");
                        await expect(receipt.events[2].event).to.be.equal("Approval"); // Reset approval
                        await expect(receipt.events.length).to.be.equal(3);
                });

                it('Test burn(w/ signature) emit Transfer, Burnt & Transfer event', async ()=> {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const amounToBurn = 1000;
                        const feeToPay = 100;
                        const nounce = Date.now();
                        const ownerKey = '0x' + gluwaInfo.OwnerKey;

                        const signature = SignHelper.signBurn(1, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, amounToBurn, feeToPay, nounce);

                        const txn = await gluwaCoin['burn(address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                amounToBurn,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "Transfer").withArgs(owner.address, owner.address, '100'); // Pay fee
                        await expect(txn).to.emit(gluwaCoin, "Burnt").withArgs(owner.address, '900');
                        await expect(txn).to.emit(gluwaCoin, "Transfer").withArgs(owner.address, zeroAddress, '900');
                        // Confirm order & events count
                        await expect(receipt.events[0].event).to.be.equal("Transfer");
                        await expect(receipt.events[1].event).to.be.equal("Burnt");
                        await expect(receipt.events[2].event).to.be.equal("Transfer");
                        await expect(receipt.events.length).to.be.equal(3);
                });

                it('Test transferFrom() emit Transfer, Transfer & Approval event', async ()=> {
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

                        const txn = await gluwaCoin.transferFrom(user1.address, owner.address, 1000, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "Approval").withArgs(user1.address, owner.address, '0'); // Reset approval
                        await expect(txn).to.emit(gluwaCoin, "Transfer").withArgs(user1.address, owner.address, '1000');
                        // Confirm order & events count
                        await expect(receipt.events[0].event).to.be.equal("Approval");
                        await expect(receipt.events[1].event).to.be.equal("Transfer");
                        await expect(receipt.events.length).to.be.equal(2);
                });

                it('Test transfer() emit Transfer & Transfer event', async ()=> {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const txn = await gluwaCoin['transfer(address,uint256)'](user1.address, 1000, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "Transfer").withArgs(owner.address, user1.address, '1000');
                        // Confirm order & events count
                        await expect(receipt.events[0].event).to.be.equal("Transfer");
                        await expect(receipt.events.length).to.be.equal(1);
                });

                it('Test transfer(w/ signature) emit Transfer & Transfer event', async ()=> {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1010, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const amounToTransfer = 1000;
                        const feeToPay = 10;
                        const nounce = Date.now();
                        const ownerKey = '0x' + gluwaInfo.OwnerKey;

                        const signature = SignHelper.signTransfer(3, gluwaInfo.ChainId, gluwaCoin.address, owner.address, ownerKey, user1.address, amounToTransfer, feeToPay, nounce);

                        const txn = await gluwaCoin['transfer(address,address,uint256,uint256,uint256,bytes)'](
                                owner.address,
                                user1.address,
                                amounToTransfer,
                                feeToPay,
                                nounce, 
                                signature, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "Transfer").withArgs(owner.address, owner.address, '10'); // Pay fee
                        await expect(txn).to.emit(gluwaCoin, "Transfer").withArgs(owner.address, user1.address, '1000');
                        // Confirm order & events count
                        await expect(receipt.events[0].event).to.be.equal("Transfer");
                        await expect(receipt.events[1].event).to.be.equal("Transfer");
                        await expect(receipt.events.length).to.be.equal(2);
                });

                it('Test execute() emit Transfer, Transfer & Transfer event', async ()=> {
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
                        const ownerKey = '0x' + gluwaInfo.OwnerKey;
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

                        const txn = await gluwaCoin.execute(owner.address, nounce, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "Transfer").withArgs(owner.address, owner.address, '10'); // Pay executor fee
                        await expect(txn).to.emit(gluwaCoin, "Transfer").withArgs(owner.address, user1.address, '1000');
                        // Confirm order & events count
                        await expect(receipt.events[0].event).to.be.equal("Transfer");
                        await expect(receipt.events[1].event).to.be.equal("Transfer");
                        await expect(receipt.events.length).to.be.equal(2);
                });

                it('Test approve() emit Approval event', async ()=> {
                        const txn = await gluwaCoin.approve(user1.address, 1000, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "Approval").withArgs(owner.address, user1.address, '1000');
                        // Confirm events count
                        await expect(receipt.events.length).to.be.equal(1);
                });

                it('Test pause() emit Paused event', async ()=> {
                        const txn = await gluwaCoin.pause({ from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "Paused").withArgs(owner.address);
                        // Confirm events count
                        await expect(receipt.events.length).to.be.equal(1);
                });

                it('Test unpause() emit Unpaused event', async ()=> {
                        const currentlyPaused = await gluwaCoin.paused();
                        if (!currentlyPaused) {
                                let inputUnpause = await gluwaCoin.connect(owner).populateTransaction.pause();
                                await TestHelper.checkResult(inputUnpause, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        const txn = await gluwaCoin.unpause({ from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "Unpaused").withArgs(owner.address);
                        // Confirm events count
                        await expect(receipt.events.length).to.be.equal(1);
                });

                it('Test addLuniverse() emit LuniverseAdded event', async ()=> {
                        const txn = await gluwaCoin.addLuniverse(user1.address, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "RoleGranted").withArgs(LuniverseRole, user1.address, owner.address);
                        await expect(txn).to.emit(gluwaCoin, "LuniverseAdded").withArgs(user1.address);
                        // Confirm order & events count
                        await expect(receipt.events[0].event).to.be.equal("RoleGranted");
                        await expect(receipt.events[1].event).to.be.equal("LuniverseAdded");
                        await expect(receipt.events.length).to.be.equal(2);
                });

                it('Test removeLuniverse() emit LuniverseRemoved event', async ()=> {
                        const isLuniverse = await gluwaCoin.isLuniverse(user1.address);
                        if (!isLuniverse) {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addLuniverse(user1.address);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        const txn = await gluwaCoin.removeLuniverse(user1.address, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "RoleRevoked").withArgs(LuniverseRole, user1.address, owner.address);
                        await expect(txn).to.emit(gluwaCoin, "LuniverseRemoved").withArgs(user1.address);
                        // Confirm order & events count
                        await expect(receipt.events[0].event).to.be.equal("RoleRevoked");
                        await expect(receipt.events[1].event).to.be.equal("LuniverseRemoved");
                        await expect(receipt.events.length).to.be.equal(2);
                });

                it('Test addGluwa() emit GluwaAdded event', async ()=> {
                        const txn = await gluwaCoin.addGluwa(user1.address, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "RoleGranted").withArgs(GluwaRole, user1.address, owner.address);
                        await expect(txn).to.emit(gluwaCoin, "GluwaAdded").withArgs(user1.address);
                        // Confirm events count
                        await expect(receipt.events.length).to.be.equal(2);
                        await expect(receipt.events[0].event).to.be.equal("RoleGranted");
                        await expect(receipt.events[1].event).to.be.equal("GluwaAdded");
                });

                it('Test removeGluwa() emit ControllerRemoved event', async ()=> {
                        const isGluwa = await gluwaCoin.isGluwa(user1.address);
                        if (!isGluwa) {
                                const input = await gluwaCoin.connect(owner).populateTransaction.addGluwa(user1.address);
                                await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        const txn = await gluwaCoin.removeGluwa(user1.address, { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) });
                        const receipt = await txn.wait();

                        await expect(txn).to.emit(gluwaCoin, "RoleRevoked").withArgs(GluwaRole, user1.address, owner.address);
                        await expect(txn).to.emit(gluwaCoin, "GluwaRemoved").withArgs(user1.address);
                        // Confirm events count
                        await expect(receipt.events.length).to.be.equal(2);
                        await expect(receipt.events[0].event).to.be.equal("RoleRevoked");
                        await expect(receipt.events[1].event).to.be.equal("GluwaRemoved");
                });
        });
});