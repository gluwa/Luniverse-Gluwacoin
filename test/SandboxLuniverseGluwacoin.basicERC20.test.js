const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers } = require('hardhat');
const TestHelper = require('./shared');
const Chance = require('chance');
const { expectEvent } = require('@openzeppelin/test-helpers');
const LuniverseGluwaCoinInfo = require('./upgradeability/LuniverseGluwaCoinInfo');
use(solidity);

var owner;
var user1;
var user2;
var sandboxToken;
var gluwaInfo;
var provider;
var zeroAddress = "0x0000000000000000000000000000000000000000";

/*
 * Test `SandboxLuniversesandboxToken`
 */
describe('SandboxLuniversesandboxToken - Basic ERC20 function', function () {
        before(async ()=>{
                gluwaInfo = await LuniverseGluwaCoinInfo();
                instance = await TestHelper.createSandboxContractInstance(ethers);
                owner = instance.owner;
                user1 = instance.user1;
                user2 = instance.user2
                user3 = instance.user3;
                provider = instance.provider;
        });
        beforeEach(async ()=>{
                contracts = await TestHelper.initializeSandboxContract(SandboxToken, owner, user1, user2, ethers, provider);
                sandboxToken = contracts.sandboxToken;

                if (gluwaInfo.network != "hardhat") {
                        await TestHelper.clearBalanceAndAllowance(sandboxToken, owner, user1, user2, user3);
                }
        });

        describe('Token Contract ETA', async function () {
                it('Pause contract / verify contract is paused', async () => {
                        const currentlyPaused = await sandboxToken.paused();
                        if (currentlyPaused) {
                                let inputUnpause = await sandboxToken.connect(owner).populateTransaction.unpause();
                                await TestHelper.checkResult(inputUnpause, sandboxToken.address, owner, ethers, provider, 0);
                        }
                        input = await sandboxToken.connect(owner).populateTransaction.pause();     
                        await TestHelper.checkResult(input, sandboxToken.address, owner, ethers, provider, 0);
                        expect(await sandboxToken.paused()).to.equal(true);
                });
                it('Unpause contract / pause+unpause and verify contract is not paused', async() => {
                        const currentlyPaused = await sandboxToken.paused();
                        if (currentlyPaused) {
                                let inputUnpause = await sandboxToken.connect(owner).populateTransaction.unpause();
                                await TestHelper.checkResult(inputUnpause, sandboxToken.address, owner, ethers, provider, 0);
                        }
                        let inputPause = await sandboxToken.connect(owner).populateTransaction.pause();     
                        await TestHelper.checkResult(inputPause, sandboxToken.address, owner, ethers, provider, 0);

                        let inputUnpause = await sandboxToken.connect(owner).populateTransaction.unpause();
                        await TestHelper.checkResult(inputUnpause, sandboxToken.address, owner, ethers, provider, 0);
                        
                        expect(await sandboxToken.paused()).to.equal(false);
                });
                it('Canot Pause contract without proper role', async () => {
                        let msg;
                        try {
                                msg = await sandboxToken.connect(user1).pause();
                        } catch(err) {
                                msg = 'You are not the owner of this contract';
                        }
                        expect(msg).to.equal('You are not the owner of this contract');
                        expect(await sandboxToken.paused()).to.equal(false);
                });
        });

        describe('Implementation and Basic', () => {
                it('Token name is ' + TestHelper.name, async() => {
                        expect(await sandboxToken.name()).to.equal(TestHelper.name);
                });
                it('Token symbol is ' + TestHelper.symbol, async() => {
                        expect(await sandboxToken.symbol()).to.equal(TestHelper.symbol);
                });
                it('Token decimals is ' + TestHelper.decimals, async() => {
                        expect(await sandboxToken.decimals()).to.equal(TestHelper.decimals);
                });
                it('Contract return a chainId', async() => {
                        const chainId = await sandboxToken.chainId();
                        expect(chainId).to.equal(gluwaInfo.ChainId);
                });
                it('Starting total supply of the token is 0 (if Luniverse: > 0 || 0)', async() => {
                        if (gluwaInfo.network == "hardhat") {
                                expect(await sandboxToken.totalSupply()).to.equal(0);
                        } else {
                                const totalSupply = await sandboxToken.totalSupply();
                                expect(totalSupply.toNumber() > 0 || totalSupply.toNumber() == 0).to.be.true;
                        }
                });
                it('Owner balance of the token is 0 (if Luniverse: > 0 || 0)', async() => {
                        if (gluwaInfo.network == "hardhat") {
                                expect((await sandboxToken.balanceOf(owner.address)).toNumber()).to.equal(0);
                        } else {
                                const balanceOfOwner = await sandboxToken.balanceOf(owner.address);
                                expect(balanceOfOwner.toNumber() > 0 || balanceOfOwner.toNumber() == 0).to.be.true;
                        }
                });
        });

        describe('Supply & Allowance', () => {
                beforeEach( async () => {
                        // Owner
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintOwner = await sandboxToken.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, sandboxToken.address, owner, ethers, provider, 0);

                        // User1
                        const randHashUser1 = await ethers.utils.randomBytes(32);
                        const inputPegUser1 = await sandboxToken.connect(owner).populateTransaction.peg(randHashUser1, 1000, user1.address);
                        await TestHelper.checkResult(inputPegUser1, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveUser1 = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashUser1);
                        await TestHelper.checkResult(inputLuniverseApproveUser1, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveUser1 = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashUser1);
                        await TestHelper.checkResult(inputGluwaApproveUser1, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintUser1 = await sandboxToken.connect(owner).populateTransaction.mint(randHashUser1);
                        await TestHelper.checkResult(inputMintUser1, sandboxToken.address, owner, ethers, provider, 0);

                        // User2
                        const randHashUser2 = await ethers.utils.randomBytes(32);
                        const inputPegUser2 = await sandboxToken.connect(owner).populateTransaction.peg(randHashUser2, 1000, user2.address);
                        await TestHelper.checkResult(inputPegUser2, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveUser2 = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashUser2);
                        await TestHelper.checkResult(inputLuniverseApproveUser2, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveUser2 = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashUser2);
                        await TestHelper.checkResult(inputGluwaApproveUser2, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintUser2 = await sandboxToken.connect(owner).populateTransaction.mint(randHashUser2);
                        await TestHelper.checkResult(inputMintUser2, sandboxToken.address, owner, ethers, provider, 0);
                });

                it('After minting 3000 token, total supply is > 3000 || 3000', async () => {
                        if (gluwaInfo.network == "hardhat") {
                                const totalSupply = await sandboxToken.totalSupply();
                                expect(totalSupply.toNumber()).to.equal(3000);
                        } else {
                                const totalSupply = await sandboxToken.totalSupply();
                                expect(totalSupply.toNumber() > 3000 || totalSupply.toNumber() == 3000).to.be.true;
                        }
                });
                it('After minting 1000 token to owner, user1 and user2, each balance should match', async () => {
                        expect((await sandboxToken.balanceOf(owner.address)).toNumber()).to.equal(1000);
                        expect((await sandboxToken.balanceOf(user1.address)).toNumber()).to.equal(1000);
                        expect((await sandboxToken.balanceOf(user2.address)).toNumber()).to.equal(1000);
                });
                it('Approve token / confirm allowance match', async () => {
                        let input = await sandboxToken.connect(owner).populateTransaction.approve(sandboxToken.address, 1000);
                        await TestHelper.checkResult(input, sandboxToken.address, owner, ethers, provider, 0);
                        expect(parseInt(await sandboxToken.allowance(owner.address, sandboxToken.address))).to.equal(1000);
                });
                it('Increase allowance / confirm allowance match', async () => {
                        let input = await sandboxToken.connect(owner).populateTransaction.approve(sandboxToken.address, 1000);
                        await TestHelper.checkResult(input, sandboxToken.address, owner, ethers, provider, 0);

                        let inputIncreaseAllowance = await sandboxToken.connect(owner).populateTransaction.increaseAllowance(sandboxToken.address, 1000);
                        await TestHelper.checkResult(inputIncreaseAllowance, sandboxToken.address, owner, ethers, provider, 0);

                        expect(parseInt(await sandboxToken.allowance(owner.address, sandboxToken.address))).to.equal(2000);
                });
                it('Decrease allowance / confirm allowance match', async () =>{
                        let input = await sandboxToken.connect(owner).populateTransaction.approve(sandboxToken.address, 1000);
                        await TestHelper.checkResult(input, sandboxToken.address, owner, ethers, provider, 0);

                        let inputDecreaseAllowance = await sandboxToken.connect(owner).populateTransaction.decreaseAllowance(sandboxToken.address, 500);
                        await TestHelper.checkResult(inputDecreaseAllowance, sandboxToken.address, owner, ethers, provider, 0);

                        expect(parseInt(await sandboxToken.allowance(owner.address, sandboxToken.address))).to.equal(500);
                });
                it('Canot decrease allowance by more than the current allowance', async () => {
                        let input = await sandboxToken.connect(owner).populateTransaction.approve(sandboxToken.address, 1000);
                        await TestHelper.checkResult(input, sandboxToken.address, owner, ethers, provider, 0);

                        let msg;
                        try {
                                msg = await sandboxToken.connect(owner).decreaseAllowance(sandboxToken.address, 5000);
                        } catch(err) {
                                msg = 'ERC20: decreased allowance below zero';
                        }
                        expect(msg).to.equal('ERC20: decreased allowance below zero');
                        expect(parseInt(await sandboxToken.allowance(owner.address, sandboxToken.address))).to.equal(1000);
                });
        });

        describe('Peg, isPeggedm, getPeg, gluwaApprove and luniverseApprove', () => {
                it('Gluwa role can Peg', async () => {
                        expect(await sandboxToken.isGluwa(user1.address)).to.equal(false);
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);
                });
                it('Luniverse role can Peg', async () => {
                        expect(await sandboxToken.isLuniverse(user1.address)).to.equal(false);
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);
                });
                it('isPegged return if the peg was successful', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, pegAmount, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        expect(await sandboxToken.isPegged(randHashOwner)).to.be.equal(true);
                });
                it('getPeg return peg detail', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, pegAmount, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);
                        
                        const peg = await sandboxToken.getPeg(randHashOwner, { from : owner.address });
                        expect(peg.amount.toNumber()).to.be.equal(pegAmount);
                });
                it('gluwaApprove work on peg txn', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, pegAmount, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, sandboxToken.address, owner, ethers, provider, 0);
                        
                        const peg = await sandboxToken.getPeg(randHashOwner, { from : owner.addres });
                        expect(peg.gluwaApproved).to.be.equal(true);
                });
                it('luniverseApprove work on peg txn', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, pegAmount, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, sandboxToken.address, owner, ethers, provider, 0);
                        
                        const peg = await sandboxToken.getPeg(randHashOwner, { from : owner.addres });
                        expect(peg.luniverseApproved).to.be.equal(true);
                });
        });

        describe('Mint & Burn', () => {
                beforeEach( async () => {
                        // Owner
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintOwner = await sandboxToken.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, sandboxToken.address, owner, ethers, provider, 0);

                        // User1
                        const randHashUser1 = await ethers.utils.randomBytes(32);
                        const inputPegUser1 = await sandboxToken.connect(owner).populateTransaction.peg(randHashUser1, 1000, user1.address);
                        await TestHelper.checkResult(inputPegUser1, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveUser1 = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashUser1);
                        await TestHelper.checkResult(inputLuniverseApproveUser1, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveUser1 = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashUser1);
                        await TestHelper.checkResult(inputGluwaApproveUser1, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintUser1 = await sandboxToken.connect(owner).populateTransaction.mint(randHashUser1);
                        await TestHelper.checkResult(inputMintUser1, sandboxToken.address, owner, ethers, provider, 0);

                        // User2
                        const randHashUser2 = await ethers.utils.randomBytes(32);
                        const inputPegUser2 = await sandboxToken.connect(owner).populateTransaction.peg(randHashUser2, 1000, user2.address);
                        await TestHelper.checkResult(inputPegUser2, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveUser2 = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashUser2);
                        await TestHelper.checkResult(inputLuniverseApproveUser2, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveUser2 = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashUser2);
                        await TestHelper.checkResult(inputGluwaApproveUser2, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintUser2 = await sandboxToken.connect(owner).populateTransaction.mint(randHashUser2);
                        await TestHelper.checkResult(inputMintUser2, sandboxToken.address, owner, ethers, provider, 0);
                });

                it('Mint 1000 token / balanceOf owner is +1000', async ()=> {
                        const originalBalance = await sandboxToken.balanceOf(owner.address);
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintOwner = await sandboxToken.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, sandboxToken.address, owner, ethers, provider, 0);

                        expect((await sandboxToken.balanceOf(owner.address)).toNumber()).to.equal(originalBalance.toNumber() + 1000);
                });
                it('Burn 1000 token / balanceOf owner is -1000', async() => {
                        const originalBalance = await sandboxToken.balanceOf(owner.address);
                        const input = await sandboxToken.connect(owner).populateTransaction['burn(uint256)'](1000);
                        await TestHelper.checkResult(input, sandboxToken.address, owner, ethers, provider, 0);

                        const finalBalance = await sandboxToken.balanceOf(owner.address);
                        /* console.log('\x1b[32m%s\x1b[0m', `
                                originalBalance: ${originalBalance}
                                finalBalance: ${finalBalance}`); */

                        expect((await sandboxToken.balanceOf(owner.address)).toNumber()).to.equal(originalBalance.toNumber() - 1000);
                });
                it('BurnFrom 1000 token / balanceOf owner is -1000', async() => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintOwner = await sandboxToken.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const originalBalance = await sandboxToken.balanceOf(owner.address);

                        const inputApprove = await sandboxToken.connect(owner).populateTransaction.approve(owner.address, 3000);
                        await TestHelper.checkResult(inputApprove, sandboxToken.address, owner, ethers, provider, 0);

                        const inputBurnFrom = await sandboxToken.connect(owner).populateTransaction.burnFrom(owner.address, 1000);
                        await TestHelper.checkResult(inputBurnFrom, sandboxToken.address, owner, ethers, provider, 0);

                        const finalBalance = await sandboxToken.balanceOf(owner.address);
                        /* console.log('\x1b[32m%s\x1b[0m', `
                                originalBalance: ${originalBalance}
                                finalBalance: ${finalBalance}`); */

                        expect((await sandboxToken.balanceOf(owner.address)).toNumber()).to.equal(originalBalance.toNumber() - 1000);
                });
                it('Impossible to burnFrom() token from someone else without allowance', async () => {
                        if (gluwaInfo.network != "hardhat") {
                                const allowance = await sandboxToken.allowance(user2.address, owner.address);

                                const inputApprove = await sandboxToken.connect(user2).populateTransaction.approve(owner.address, 0);
                                await TestHelper.checkResult(inputApprove, sandboxToken.address, user2, ethers, provider, 0);
                        }
                        const originalBalance = await sandboxToken.balanceOf(user2.address);
                        let msg;
                        try {
                                msg = await sandboxToken.burnFrom(user2.address, 10000000, {from: owner.address});
                                console.log('msg', msg);
                        } catch(err) {
                                msg = 'ERC20: burn amount exceeds allowancee';
                        }
                        expect(msg).to.equal('ERC20: burn amount exceeds allowancee');
                        expect((await sandboxToken.balanceOf(user2.address)).toNumber()).to.be.equal(originalBalance.toNumber());
                });
        });

        describe('TransferTo & TransferFrom', () => {
                beforeEach( async () => {
                        // Owner
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintOwner = await sandboxToken.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, sandboxToken.address, owner, ethers, provider, 0);

                        // User1
                        const randHashUser1 = await ethers.utils.randomBytes(32);
                        const inputPegUser1 = await sandboxToken.connect(owner).populateTransaction.peg(randHashUser1, 1000, user1.address);
                        await TestHelper.checkResult(inputPegUser1, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveUser1 = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashUser1);
                        await TestHelper.checkResult(inputLuniverseApproveUser1, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveUser1 = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashUser1);
                        await TestHelper.checkResult(inputGluwaApproveUser1, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintUser1 = await sandboxToken.connect(owner).populateTransaction.mint(randHashUser1);
                        await TestHelper.checkResult(inputMintUser1, sandboxToken.address, owner, ethers, provider, 0);

                        // User2
                        const randHashUser2 = await ethers.utils.randomBytes(32);
                        const inputPegUser2 = await sandboxToken.connect(owner).populateTransaction.peg(randHashUser2, 1000, user2.address);
                        await TestHelper.checkResult(inputPegUser2, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveUser2 = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashUser2);
                        await TestHelper.checkResult(inputLuniverseApproveUser2, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveUser2 = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashUser2);
                        await TestHelper.checkResult(inputGluwaApproveUser2, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintUser2 = await sandboxToken.connect(owner).populateTransaction.mint(randHashUser2);
                        await TestHelper.checkResult(inputMintUser2, sandboxToken.address, owner, ethers, provider, 0);
                });

                it('Test transferFrom() from owner/ verify balanceOf owner is -1000',async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintOwner = await sandboxToken.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const giverBalance = await sandboxToken.balanceOf(owner.address);
                        const reveiverBalance = await sandboxToken.balanceOf(user1.address);

                        const inputApprove = await sandboxToken.connect(owner).populateTransaction.approve(owner.address, 3000);
                        await TestHelper.checkResult(inputApprove, sandboxToken.address, owner, ethers, provider, 0);

                        const inputTransfer = await sandboxToken.connect(owner).populateTransaction.transferFrom(owner.address, user1.address, 1000, {
                                gasLimit: ethers.utils.hexlify(3500000),
                        });
                        await TestHelper.checkResult(inputTransfer, sandboxToken.address, owner, ethers, provider, 0);

                        const giverNewBalance = await sandboxToken.balanceOf(owner.address);
                        const receiverNewBalance = await sandboxToken.balanceOf(user1.address);
                /*  console.log('\x1b[32m%s\x1b[0m', `
                                giverBalance: ${giverBalance}
                                giverNewBalance: ${giverNewBalance}
                                reveiverBalance: ${reveiverBalance}
                                receiverNewBalance: ${receiverNewBalance}`); */
                        expect((await sandboxToken.balanceOf(user1.address)).toNumber()).to.equal(reveiverBalance.toNumber() + 1000);
                        expect((await sandboxToken.balanceOf(owner.address)).toNumber()).to.equal(giverBalance.toNumber() - 1000);
                });
                it('Test transferFrom() from user2/ verify balanceOf user2 is -1000',async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, 1000, user2.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintOwner = await sandboxToken.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const giverBalance = await sandboxToken.balanceOf(owner.address);
                        const reveiverBalance = await sandboxToken.balanceOf(user1.address);

                        const inputApprove = await sandboxToken.connect(owner).populateTransaction.approve(user2.address, 3000);
                        await TestHelper.checkResult(inputApprove, sandboxToken.address, owner, ethers, provider, 0);

                        const inputTransfer = await sandboxToken.connect(user2).populateTransaction.transferFrom(owner.address, user1.address, 1000, {
                                gasLimit: ethers.utils.hexlify(3500000),
                        });
                        await TestHelper.checkResult(inputTransfer, sandboxToken.address, user2, ethers, provider, 0);

                        const giverNewBalance = await sandboxToken.balanceOf(owner.address);
                        const receiverNewBalance = await sandboxToken.balanceOf(user1.address);
                /*  console.log('\x1b[32m%s\x1b[0m', `
                                giverBalance: ${giverBalance}
                                giverNewBalance: ${giverNewBalance}
                                reveiverBalance: ${reveiverBalance}
                                receiverNewBalance: ${receiverNewBalance}`); */
                        expect((await sandboxToken.balanceOf(user1.address)).toNumber()).to.equal(reveiverBalance.toNumber() + 1000);
                        expect((await sandboxToken.balanceOf(owner.address)).toNumber()).to.equal(giverBalance.toNumber() - 1000);
                });

                it('Test transfer() / verify balanceOf owner is -1000', async function () {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintOwner = await sandboxToken.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const giverBalance = await sandboxToken.balanceOf(owner.address);
                        const reveiverBalance = await sandboxToken.balanceOf(user1.address);

                        const inputTransfer = await sandboxToken.connect(owner).populateTransaction['transfer(address,uint256)'](user1.address, 1000, { from: owner.address });
                        await TestHelper.checkResult(inputTransfer, sandboxToken.address, owner, ethers, provider, 0);

                        const giverNewBalance = await sandboxToken.balanceOf(owner.address);
                        const receiverNewBalance = await sandboxToken.balanceOf(user1.address);
                /* console.log('\x1b[32m%s\x1b[0m', `
                                giverBalance: ${giverBalance}
                                giverNewBalance: ${giverNewBalance}
                                reveiverBalance: ${reveiverBalance}
                                receiverNewBalance: ${receiverNewBalance}`); */
                        expect((await sandboxToken.balanceOf(user1.address)).toNumber()).to.equal(reveiverBalance.toNumber() + 1000);
                        expect((await sandboxToken.balanceOf(owner.address)).toNumber()).to.equal(giverBalance.toNumber() - 1000);
                });
        });

        describe('Test bad transfer scenario', () => {
                it('Test transfer() token without balance', async () => {
                        let msg;
                        try {
                                msg = await sandboxToken['transfer(address,uint256)'](user1.address, 500, { from: owner.address });
                        } catch(err) {
                                msg = 'ERC20WithSafeTransfer: insufficient balance';
                        }
                        expect(msg).to.equal('ERC20WithSafeTransfer: insufficient balance');
                });
                it('Test transferFrom() token without balance', async () => {
                        let msg;
                        try {
                                msg = await sandboxToken.transferFrom(owner.address, user1.address, 500);
                        } catch(err) {
                                msg = 'ERC20WithSafeTransfer: insufficient balance';
                        }
                        expect(msg).to.equal('ERC20WithSafeTransfer: insufficient balance');
                });
                it('Test transferFrom() token without allowance', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, 500, owner.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintOwner = await sandboxToken.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, sandboxToken.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputTransfer = await sandboxToken.connect(user1).populateTransaction.transferFrom(owner.address, user1.address, 500);
                                msg = await TestHelper.checkResult(inputTransfer, sandboxToken.address, user1, ethers, provider, 0);
                        } catch(err) {
                                msg = 'ERC20: transfer amount exceeds allowance';
                        }
                        expect(msg).to.equal('ERC20: transfer amount exceeds allowance');
                });
                it('Test transferFrom() token without allowance but admin role', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await sandboxToken.connect(owner).populateTransaction.peg(randHashOwner, 500, user1.address);
                        await TestHelper.checkResult(inputPegOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await sandboxToken.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await sandboxToken.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, sandboxToken.address, owner, ethers, provider, 0);

                        const inputMintOwner = await sandboxToken.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, sandboxToken.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputTransfer = await sandboxToken.connect(user1).populateTransaction.transferFrom(user1.address, user2.address, 500);
                                msg = await TestHelper.checkResult(inputTransfer, sandboxToken.address, user1, ethers, provider, 0);
                        } catch(err) {
                                msg = 'Controller  Role: caller does not have the Controller  role';
                        }
                        expect(msg).to.equal('Controller  Role: caller does not have the Controller  role');
                });
        });
});