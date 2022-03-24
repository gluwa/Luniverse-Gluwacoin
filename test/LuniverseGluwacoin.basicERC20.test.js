const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers } = require('hardhat');
const TestHelper = require('./shared');
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
describe('LuniverseGluwacoin - Basic ERC20 function', function () {
        before(async ()=>{
                gluwaInfo = await LuniverseGluwaCoinInfo();
                instance = await TestHelper.createContractInstance(ethers);
                owner = instance.owner;
                user1 = instance.user1;
                user2 = instance.user2
                user3 = instance.user3;
                provider = instance.provider;

                if (gluwaInfo.network == "hardhat") {
                        console.log('\x1b[32m%s\x1b[0m', `Running test on
                        db       .d88b.   .o88b.  .d8b.  db      db    db .88b  d88. 
                        88      .8P  Y8. d8P  Y8 d8' '8b 88      88    88 88'YbdP'88 
                        88      88    88 8P      88ooo88 88      Y8    8P 88  88  88 
                        88      88    88 8b      88~~~88 88      '8b  d8' 88  88  88 
                        88booo. '8b  d8' Y8b  d8 88   88 88booo.  '8bd8'  88  88  88 
                        Y88888P  'Y88P'   'Y88P' YP   YP Y88888P    YP    YP  YP  YP 
                        `);
                } else {
                        if(gluwaInfo.network == "luniverse") {
                                console.log('\x1b[34m%s\x1b[0m', `Running test on
                                db      db    db d8b   db d888888b db    db d88888b d8888b. .d8888. d88888b 
                                88      88    88 888o  88   '88'   88    88 88'     88  '8D 88'  YP 88'     
                                88      88    88 88V8o 88    88    Y8    8P 88ooooo 88oobY' '8bo.   88ooooo 
                                88      88    88 88 V8o88    88    '8b  d8' 88~~~~~ 88'8b     'Y8b. 88~~~~~ 
                                88booo. 88b  d88 88  V888   .88.    '8bd8'  88.     88 '88. db   8D 88.     
                                Y88888P ~Y8888P' VP   V8P Y888888P    YP    Y88888P 88   YD '8888Y' Y88888P 
                        `);
                        }
                        if(gluwaInfo.network == "kaleido") {
                                console.log('\x1b[34m%s\x1b[0m', `Running test on
                                dP     dP          dP          oo       dP          
                                88   .d8'          88                   88          
                                88aaa8P'  .d8888b. 88 .d8888b. dP .d888b88 .d8888b. 
                                88   '8b. 88'  '88 88 88ooood8 88 88'  '88 88'  '88 
                                88     88 88.  .88 88 88.  ... 88 88.  .88 88.  .88 
                                dP     dP '88888P8 dP '88888P' dP '88888P8 '88888P' 
                                oooooooooooooooooooooooooooooooooooooooooooooooooooo     
                                `);
                        }

                        // /* Make sure we are running the last version */    
                        if (await TestHelper.getImplementation(ethers) !== gluwaInfo.TokenLogicAddress) {
                                console.log('logicAddressBeforeUpgrade', await TestHelper.getImplementation(ethers));
                                console.log('logicAddressToUpgradeTo', gluwaInfo.TokenLogicAddress);

                                TestHelper.upgradeContract(gluwaInfo.TokenLogicAddress, ethers);

                                console.log('\x1b[34m%s\x1b[0m', 'Verify Proxy implementation After Upgrade', await TestHelper.getImplementation(ethers));
                        }
                        else {
                                console.log('\x1b[32m%s\x1b[0m', 'Verify Proxy implementation', 'Contract is already using last logic version!');
                        }
                        console.log('\x1b[32m%s\x1b[0m', 'Token address: ', gluwaInfo.Token.address);
                        console.log('Current logic: ', gluwaInfo.TokenLogicAddress);
                }
        });
        beforeEach(async ()=>{
                contracts = await TestHelper.initializeContract(Gluwacoin, owner, user1, user2, ethers, provider);
                gluwaCoin = contracts.gluwaCoin;

                if (gluwaInfo.network != "hardhat") {
                        await TestHelper.clearBalanceAndAllowance(gluwaCoin, owner, user1, user2, user3);
                }
        });

        describe('Token Contract ETA', async function () {
                it('Pause contract / verify contract is paused', async () => {
                        const currentlyPaused = await gluwaCoin.paused();
                        if (currentlyPaused) {
                                let inputUnpause = await gluwaCoin.connect(owner).populateTransaction.unpause();
                                await TestHelper.checkResult(inputUnpause, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        input = await gluwaCoin.connect(owner).populateTransaction.pause();     
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        expect(await gluwaCoin.paused()).to.equal(true);
                });
                it('Unpause contract / pause+unpause and verify contract is not paused', async() => {
                        const currentlyPaused = await gluwaCoin.paused();
                        if (currentlyPaused) {
                                let inputUnpause = await gluwaCoin.connect(owner).populateTransaction.unpause();
                                await TestHelper.checkResult(inputUnpause, gluwaCoin.address, owner, ethers, provider, 0);
                        }
                        let inputPause = await gluwaCoin.connect(owner).populateTransaction.pause();     
                        await TestHelper.checkResult(inputPause, gluwaCoin.address, owner, ethers, provider, 0);

                        let inputUnpause = await gluwaCoin.connect(owner).populateTransaction.unpause();
                        await TestHelper.checkResult(inputUnpause, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        expect(await gluwaCoin.paused()).to.equal(false);
                });
                it('Canot Pause contract without proper role', async () => {
                        expect(await gluwaCoin.isGluwa(user3.address)).to.equal(false);
                        expect(await gluwaCoin.isLuniverse(user3.address)).to.equal(false);

                        const currentlyPaused = await gluwaCoin.paused();
                        if (currentlyPaused) {
                                let inputUnpause = await gluwaCoin.connect(owner).populateTransaction.unpause();
                                await TestHelper.checkResult(inputUnpause, gluwaCoin.address, owner, ethers, provider, 0);
                        }

                        let inputUnpause = await gluwaCoin.connect(user3).populateTransaction.pause();
                        await TestHelper.checkResult(inputUnpause, gluwaCoin.address, user3, ethers, provider, 1);
                        expect(await gluwaCoin.paused()).to.equal(false);
                });
                it('Canot Un-Pause contract without proper role', async () => {
                        expect(await gluwaCoin.isGluwa(user3.address)).to.equal(false);
                        expect(await gluwaCoin.isLuniverse(user3.address)).to.equal(false);

                        const currentlyPaused = await gluwaCoin.paused();
                        if (!currentlyPaused) {
                                let inputUnpause = await gluwaCoin.connect(owner).populateTransaction.pause();
                                await TestHelper.checkResult(inputUnpause, gluwaCoin.address, owner, ethers, provider, 0);
                        }

                        let inputUnpause = await gluwaCoin.connect(user3).populateTransaction.unpause();
                        await TestHelper.checkResult(inputUnpause, gluwaCoin.address, user3, ethers, provider, 1);
                        expect(await gluwaCoin.paused()).to.equal(true);

                        if(gluwaInfo.network !== "hardhat") {
                                let inputUnpause = await gluwaCoin.connect(owner).populateTransaction.unpause();
                                await TestHelper.checkResult(inputUnpause, gluwaCoin.address, owner, ethers, provider, 0);
                                expect(await gluwaCoin.paused()).to.equal(false);
                        }
                });
        });
        
        describe('Implementation and Basic', () => {
                it('Token name is ' + TestHelper.name, async() => {
                        expect(await gluwaCoin.name()).to.equal(TestHelper.name);
                });
                it('Token symbol is ' + TestHelper.symbol, async() => {
                        expect(await gluwaCoin.symbol()).to.equal(TestHelper.symbol);
                });
                it('Token decimals is ' + TestHelper.decimals, async() => {
                        expect(await gluwaCoin.decimals()).to.equal(TestHelper.decimals);
                });
                it('Contract return chainId', async() => {
                        const chainId = await gluwaCoin.chainId();
                        console.log('ChainId: ', chainId.toString());
                        expect(chainId).to.equal(gluwaInfo.ChainId);
                });
                it('Starting total supply of the token is 0 (if Luniverse: > 0 || 0)', async() => {
                        if (gluwaInfo.network == "hardhat") {
                                expect(await gluwaCoin.totalSupply()).to.equal(0);
                        } else {
                                const totalSupply = await gluwaCoin.totalSupply();
                                expect(totalSupply.toNumber() > 0 || totalSupply.toNumber() == 0).to.be.true;
                        }
                });
                 it('Owner balance of the token is 0 (if Luniverse: > 0 || 0)', async() => {
                        if (gluwaInfo.network == "hardhat") {
                                expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(0);
                        } else {
                                const balanceOfOwner = await gluwaCoin.balanceOf(owner.address);
                                expect(balanceOfOwner.toNumber() > 0 || balanceOfOwner.toNumber() == 0).to.be.true;
                        }
                });
        });

        describe('Supply & Allowance', () => {
                beforeEach( async () => {
                        // Owner
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        // User1
                        const randHashUser1 = await ethers.utils.randomBytes(32);
                        const inputPegUser1 = await gluwaCoin.connect(owner).populateTransaction.peg(randHashUser1, 1000, user1.address);
                        await TestHelper.checkResult(inputPegUser1, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveUser1 = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashUser1);
                        await TestHelper.checkResult(inputLuniverseApproveUser1, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveUser1 = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashUser1);
                        await TestHelper.checkResult(inputGluwaApproveUser1, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintUser1 = await gluwaCoin.connect(owner).populateTransaction.mint(randHashUser1);
                        await TestHelper.checkResult(inputMintUser1, gluwaCoin.address, owner, ethers, provider, 0);

                        // User2
                        const randHashUser2 = await ethers.utils.randomBytes(32);
                        const inputPegUser2 = await gluwaCoin.connect(owner).populateTransaction.peg(randHashUser2, 1000, user2.address);
                        await TestHelper.checkResult(inputPegUser2, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveUser2 = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashUser2);
                        await TestHelper.checkResult(inputLuniverseApproveUser2, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveUser2 = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashUser2);
                        await TestHelper.checkResult(inputGluwaApproveUser2, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintUser2 = await gluwaCoin.connect(owner).populateTransaction.mint(randHashUser2);
                        await TestHelper.checkResult(inputMintUser2, gluwaCoin.address, owner, ethers, provider, 0);
                });

                it('After minting 3000 token, total supply is > 3000 || 3000', async () => {
                        if (gluwaInfo.network == "hardhat") {
                                const totalSupply = await gluwaCoin.totalSupply();
                                expect(totalSupply.toNumber()).to.equal(3000);
                        } else {
                                const totalSupply = await gluwaCoin.totalSupply();
                                expect(totalSupply.toNumber() > 3000 || totalSupply.toNumber() == 3000).to.be.true;
                        }
                });
                it('After minting 1000 token to owner, user1 and user2, each balance should match', async () => {
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(1000);
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(1000);
                        expect((await gluwaCoin.balanceOf(user2.address)).toNumber()).to.equal(1000);
                });
                it('Approve token / confirm allowance match', async () => {
                        let input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 1000);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(1000);
                });
                it('Increase allowance / confirm allowance match', async () => {
                        let input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 1000);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);

                        let inputIncreaseAllowance = await gluwaCoin.connect(owner).populateTransaction.increaseAllowance(gluwaCoin.address, 1000);
                        await TestHelper.checkResult(inputIncreaseAllowance, gluwaCoin.address, owner, ethers, provider, 0);

                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(2000);
                });
                it('Decrease allowance / confirm allowance match', async () =>{
                        let input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 1000);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);

                        let inputDecreaseAllowance = await gluwaCoin.connect(owner).populateTransaction.decreaseAllowance(gluwaCoin.address, 500);
                        await TestHelper.checkResult(inputDecreaseAllowance, gluwaCoin.address, owner, ethers, provider, 0);

                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(500);
                });
                it('Canot decrease allowance by more than the current allowance', async () => {
                        let input = await gluwaCoin.connect(owner).populateTransaction.approve(gluwaCoin.address, 1000);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);

                        let msg;
                        try {
                                msg = await gluwaCoin.connect(owner).decreaseAllowance(gluwaCoin.address, 5000);
                        } catch(err) {
                                msg = 'ERC20: decreased allowance below zero';
                        }
                        expect(msg).to.equal('ERC20: decreased allowance below zero');
                        expect(parseInt(await gluwaCoin.allowance(owner.address, gluwaCoin.address))).to.equal(1000);
                });
        });

        describe('Peg, isPeggedm, getPeg, gluwaApprove and luniverseApprove', () => {
                it('Gluwa role can Peg', async () => {
                        expect(await gluwaCoin.isGluwa(user1.address)).to.equal(false);
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);
                });
                it('Luniverse role can Peg', async () => {
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.equal(false);
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);
                });
                it('isPegged return if the peg was successful', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, pegAmount, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        expect(await gluwaCoin.isPegged(randHashOwner)).to.be.equal(true);
                });
                it('getPeg return peg detail', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, pegAmount, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        const peg = await gluwaCoin.getPeg(randHashOwner, { from : owner.address });
                        expect(peg.amount.toNumber()).to.be.equal(pegAmount);
                });
                it('gluwaApprove work on peg txn', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, pegAmount, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        const peg = await gluwaCoin.getPeg(randHashOwner, { from : owner.addres });
                        expect(peg.gluwaApproved).to.be.equal(true);
                });
                it('luniverseApprove work on peg txn', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const pegAmount = 1000;
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, pegAmount, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        
                        const peg = await gluwaCoin.getPeg(randHashOwner, { from : owner.addres });
                        expect(peg.luniverseApproved).to.be.equal(true);
                });
                it('isPegged return false if the peg do not exist', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);

                        expect(await gluwaCoin.isPegged(randHashOwner)).to.be.equal(false);
                });
        });
                
        describe('Mint & Burn', () => {
                beforeEach( async () => {
                        // Owner
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        // User1
                        const randHashUser1 = await ethers.utils.randomBytes(32);
                        const inputPegUser1 = await gluwaCoin.connect(owner).populateTransaction.peg(randHashUser1, 1000, user1.address);
                        await TestHelper.checkResult(inputPegUser1, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveUser1 = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashUser1);
                        await TestHelper.checkResult(inputLuniverseApproveUser1, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveUser1 = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashUser1);
                        await TestHelper.checkResult(inputGluwaApproveUser1, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintUser1 = await gluwaCoin.connect(owner).populateTransaction.mint(randHashUser1);
                        await TestHelper.checkResult(inputMintUser1, gluwaCoin.address, owner, ethers, provider, 0);

                        // User2
                        const randHashUser2 = await ethers.utils.randomBytes(32);
                        const inputPegUser2 = await gluwaCoin.connect(owner).populateTransaction.peg(randHashUser2, 1000, user2.address);
                        await TestHelper.checkResult(inputPegUser2, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveUser2 = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashUser2);
                        await TestHelper.checkResult(inputLuniverseApproveUser2, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveUser2 = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashUser2);
                        await TestHelper.checkResult(inputGluwaApproveUser2, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintUser2 = await gluwaCoin.connect(owner).populateTransaction.mint(randHashUser2);
                        await TestHelper.checkResult(inputMintUser2, gluwaCoin.address, owner, ethers, provider, 0);
                });

                it('Mint 1000 token / balanceOf owner is +1000', async ()=> {
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

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(originalBalance.toNumber() + 1000);
                });
                it('Non-Admin can\'t mint token', async () => {
                        const originalBalance = await gluwaCoin.balanceOf(user1.address);
                        
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(user1).populateTransaction.peg(randHashOwner, 1000, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, user1, ethers, provider, 'Peggable: caller does not have the Gluwa role or the Luniverse role');

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(user1).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, user1, ethers, provider, 'LuniverseRole: caller does not have the Luniverse role');

                        const inputGluwaApproveOwner = await gluwaCoin.connect(user1).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, user1, ethers, provider, 'GluwaRole: caller does not have the Gluwa role');

                        const inputMintOwner = await gluwaCoin.connect(user1).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, user1, ethers, provider, 'Peggable: the txnHash is not pegged');
                        
                        expect(await gluwaCoin.isGluwa(user1.address)).to.equal(false);
                        expect(await gluwaCoin.isLuniverse(user1.address)).to.equal(false);
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.be.equal(originalBalance.toNumber());
                });
                it('Burn 1000 token / balanceOf owner is -1000', async() => {
                        const originalBalance = await gluwaCoin.balanceOf(owner.address);
                        const input = await gluwaCoin.connect(owner).populateTransaction['burn(uint256)'](1000);
                        await TestHelper.checkResult(input, gluwaCoin.address, owner, ethers, provider, 0);

                        const finalBalance = await gluwaCoin.balanceOf(owner.address);
                        /* console.log('\x1b[32m%s\x1b[0m', `
                                originalBalance: ${originalBalance}
                                finalBalance: ${finalBalance}`); */

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(originalBalance.toNumber() - 1000);
                });
                it('Impossible to burn() token from someone else without balance', async () => {
                        const originalBalance = await gluwaCoin.balanceOf(user1.address);
                        if (originalBalance.toNumber() > 0) {
                                const input = await gluwaCoin.connect(user1).populateTransaction['burn(uint256)'](originalBalance, {from: user1.address});
                                await TestHelper.checkResult(input, gluwaCoin.address, user1, ethers, provider, 0);
                        }
                        let msg;
                        try {
                                const inputBurnFrom = await gluwaCoin.connect(user1).populateTransaction.burn(1000);
                                msg = await TestHelper.txn(inputBurnFrom, gluwaCoin.address, user1, ethers, provider, 0);
                        } catch(err) {
                                msg = 'ERC20: burn amount exceeds balance';
                        }
                        expect(msg).to.equal('ERC20: burn amount exceeds balance');
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.be.equal(0);
                });
                it('BurnFrom 1000 token / balanceOf owner is -1000', async() => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const originalBalance = await gluwaCoin.balanceOf(owner.address);

                        const inputApprove = await gluwaCoin.connect(owner).populateTransaction.approve(owner.address, 3000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputBurnFrom = await gluwaCoin.connect(owner).populateTransaction.burnFrom(owner.address, 1000);
                        await TestHelper.checkResult(inputBurnFrom, gluwaCoin.address, owner, ethers, provider, 0);

                        const finalBalance = await gluwaCoin.balanceOf(owner.address);
                        /* console.log('\x1b[32m%s\x1b[0m', `
                                originalBalance: ${originalBalance}
                                finalBalance: ${finalBalance}`); */

                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(originalBalance.toNumber() - 1000);
                });
                it('Impossible to burnFrom() token from someone else without allowance', async () => {
                        if (gluwaInfo.network != "hardhat") {
                                const allowance = await gluwaCoin.allowance(user2.address, owner.address);

                                const inputApprove = await gluwaCoin.connect(user2).populateTransaction.approve(owner.address, 0);
                                await TestHelper.checkResult(inputApprove, gluwaCoin.address, user2, ethers, provider, 0);
                        }
                        const originalBalance = await gluwaCoin.balanceOf(user2.address);
                        let msg;
                        try {
                                msg = await gluwaCoin.burnFrom(user2.address, 10000000, {from: owner.address});
                                console.log('msg', msg);
                        } catch(err) {
                                msg = 'ERC20: burn amount exceeds allowancee';
                        }
                        expect(msg).to.equal('ERC20: burn amount exceeds allowancee');
                        expect((await gluwaCoin.balanceOf(user2.address)).toNumber()).to.be.equal(originalBalance.toNumber());
                });
        });

        describe('TransferTo & TransferFrom', () => {
                beforeEach( async () => {
                        // Owner
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        // User1
                        const randHashUser1 = await ethers.utils.randomBytes(32);
                        const inputPegUser1 = await gluwaCoin.connect(owner).populateTransaction.peg(randHashUser1, 1000, user1.address);
                        await TestHelper.checkResult(inputPegUser1, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveUser1 = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashUser1);
                        await TestHelper.checkResult(inputLuniverseApproveUser1, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveUser1 = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashUser1);
                        await TestHelper.checkResult(inputGluwaApproveUser1, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintUser1 = await gluwaCoin.connect(owner).populateTransaction.mint(randHashUser1);
                        await TestHelper.checkResult(inputMintUser1, gluwaCoin.address, owner, ethers, provider, 0);

                        // User2
                        const randHashUser2 = await ethers.utils.randomBytes(32);
                        const inputPegUser2 = await gluwaCoin.connect(owner).populateTransaction.peg(randHashUser2, 1000, user2.address);
                        await TestHelper.checkResult(inputPegUser2, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveUser2 = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashUser2);
                        await TestHelper.checkResult(inputLuniverseApproveUser2, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveUser2 = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashUser2);
                        await TestHelper.checkResult(inputGluwaApproveUser2, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintUser2 = await gluwaCoin.connect(owner).populateTransaction.mint(randHashUser2);
                        await TestHelper.checkResult(inputMintUser2, gluwaCoin.address, owner, ethers, provider, 0);
                });

                it('Test transferFrom() from owner/ verify balanceOf owner is -1000',async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const giverBalance = await gluwaCoin.balanceOf(owner.address);
                        const reveiverBalance = await gluwaCoin.balanceOf(user1.address);

                        const inputApprove = await gluwaCoin.connect(owner).populateTransaction.approve(owner.address, 3000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputTransfer = await gluwaCoin.connect(owner).populateTransaction.transferFrom(owner.address, user1.address, 1000, {
                                gasLimit: ethers.utils.hexlify(3500000),
                        });
                        await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);

                        const giverNewBalance = await gluwaCoin.balanceOf(owner.address);
                        const receiverNewBalance = await gluwaCoin.balanceOf(user1.address);
                /*  console.log('\x1b[32m%s\x1b[0m', `
                                giverBalance: ${giverBalance}
                                giverNewBalance: ${giverNewBalance}
                                reveiverBalance: ${reveiverBalance}
                                receiverNewBalance: ${receiverNewBalance}`); */
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(reveiverBalance.toNumber() + 1000);
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(giverBalance.toNumber() - 1000);
                });
                it('Test transferFrom() from user2/ verify balanceOf user2 is -1000',async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, user2.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const giverBalance = await gluwaCoin.balanceOf(owner.address);
                        const reveiverBalance = await gluwaCoin.balanceOf(user1.address);

                        const inputApprove = await gluwaCoin.connect(owner).populateTransaction.approve(user2.address, 3000);
                        await TestHelper.checkResult(inputApprove, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputTransfer = await gluwaCoin.connect(user2).populateTransaction.transferFrom(owner.address, user1.address, 1000, {
                                gasLimit: ethers.utils.hexlify(3500000),
                        });
                        await TestHelper.checkResult(inputTransfer, gluwaCoin.address, user2, ethers, provider, 0);

                        const giverNewBalance = await gluwaCoin.balanceOf(owner.address);
                        const receiverNewBalance = await gluwaCoin.balanceOf(user1.address);
                /*  console.log('\x1b[32m%s\x1b[0m', `
                                giverBalance: ${giverBalance}
                                giverNewBalance: ${giverNewBalance}
                                reveiverBalance: ${reveiverBalance}
                                receiverNewBalance: ${receiverNewBalance}`); */
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(reveiverBalance.toNumber() + 1000);
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(giverBalance.toNumber() - 1000);
                });

                it('Test transfer() / verify balanceOf owner is -1000', async function () {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 1000, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const giverBalance = await gluwaCoin.balanceOf(owner.address);
                        const reveiverBalance = await gluwaCoin.balanceOf(user1.address);

                        const inputTransfer = await gluwaCoin.connect(owner).populateTransaction['transfer(address,uint256)'](user1.address, 1000, { from: owner.address });
                        await TestHelper.checkResult(inputTransfer, gluwaCoin.address, owner, ethers, provider, 0);

                        const giverNewBalance = await gluwaCoin.balanceOf(owner.address);
                        const receiverNewBalance = await gluwaCoin.balanceOf(user1.address);
                /* console.log('\x1b[32m%s\x1b[0m', `
                                giverBalance: ${giverBalance}
                                giverNewBalance: ${giverNewBalance}
                                reveiverBalance: ${reveiverBalance}
                                receiverNewBalance: ${receiverNewBalance}`); */
                        expect((await gluwaCoin.balanceOf(user1.address)).toNumber()).to.equal(reveiverBalance.toNumber() + 1000);
                        expect((await gluwaCoin.balanceOf(owner.address)).toNumber()).to.equal(giverBalance.toNumber() - 1000);
                });
        });

        describe('Test bad transfer scenario', () => {
                it('Test transfer() token without balance', async () => {
                        let msg;
                        try {
                                msg = await gluwaCoin['transfer(address,uint256)'](user1.address, 500, { from: owner.address });
                        } catch(err) {
                                msg = 'ERC20WithSafeTransfer: insufficient balance';
                        }
                        expect(msg).to.equal('ERC20WithSafeTransfer: insufficient balance');
                });
                it('Test transferFrom() token without balance', async () => {
                        let msg;
                        try {
                                msg = await gluwaCoin.transferFrom(owner.address, user1.address, 500);
                        } catch(err) {
                                msg = 'ERC20WithSafeTransfer: insufficient balance';
                        }
                        expect(msg).to.equal('ERC20WithSafeTransfer: insufficient balance');
                });
                it('Test transferFrom() token from 0x00... address', async () => {
                        let msg;
                        try {
                                msg = await gluwaCoin.transferFrom(zeroAddress, user1.address, 500);
                        } catch(err) {
                                msg = 'ERC20WithSafeTransfer: insufficient balance';
                        }
                        expect(msg).to.equal('ERC20WithSafeTransfer: insufficient balance');
                });
                it('Test transferFrom() token without allowance', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 500, owner.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction.transferFrom(user1.address, user2.address, 500);
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, user1, ethers, provider, 0);
                        } catch(err) {
                                msg = 'ERC20: transfer amount exceeds allowance';
                        }
                        expect(msg).to.equal('ERC20: transfer amount exceeds allowance');
                });
                it('Test transferFrom() token without allowance but admin role', async () => {
                        const randHashOwner = await ethers.utils.randomBytes(32);
                        const inputPegOwner = await gluwaCoin.connect(owner).populateTransaction.peg(randHashOwner, 500, user1.address);
                        await TestHelper.checkResult(inputPegOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputLuniverseApproveOwner = await gluwaCoin.connect(owner).populateTransaction.luniverseApprove(randHashOwner);
                        await TestHelper.checkResult(inputLuniverseApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputGluwaApproveOwner = await gluwaCoin.connect(owner).populateTransaction.gluwaApprove(randHashOwner);
                        await TestHelper.checkResult(inputGluwaApproveOwner, gluwaCoin.address, owner, ethers, provider, 0);

                        const inputMintOwner = await gluwaCoin.connect(owner).populateTransaction.mint(randHashOwner);
                        await TestHelper.checkResult(inputMintOwner, gluwaCoin.address, owner, ethers, provider, 0);
                        let msg;
                        try {
                                const inputTransfer = await gluwaCoin.connect(owner).populateTransaction.transferFrom(user1.address, user2.address, 500);
                                msg = await TestHelper.checkResult(inputTransfer, gluwaCoin.address, user1, ethers, provider, 0);
                        } catch(err) {
                                msg = 'Controller  Role: caller does not have the Controller  role';
                        }
                        expect(msg).to.equal('Controller  Role: caller does not have the Controller  role');
                });
        });

        describe('Other', () => {
                it('New Function not found in Token01', async () => {
                        let msg;
                        try{
                                msg = await gluwaCoin.newFunc();
                        }catch(err){
                                msg = 'New Function not exists in Token01';
                        }
                        expect(msg).to.equal('New Function not exists in Token01');
                });
                it('New Variable not found in Token01', async () => {
                        let msg;
                        try{
                                msg = await gluwaCoin.newVar();
                        }catch(err){
                                msg = 'New Variable not exists in Token01';
                        }
                        expect(msg).to.equal('New Variable not exists in Token01');
                });
        });
});
