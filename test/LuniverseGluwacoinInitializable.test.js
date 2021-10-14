// Load dependencies
const crypto = require('crypto');
const { expect } = require('chai');
const { accounts, privateKeys, contract, web3 } = require('@openzeppelin/test-environment');

// Import utilities from Test Helpers
const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS, MAX_UINT256 } = constants;

// Load compiled artifacts
const LuniverseGluwacoin = contract.fromArtifact('LuniverseGluwacoin');

var sign = require('./signature');

// Start test block
describe('LuniverseGluwacoin_Initialization', function () {
    const [ deployer ] = accounts;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
    });

    it('token name is ' + name, async function () {
        expect(await this.token.name()).to.equal(name);
    });

    it('token symbol is ' + symbol, async function () {
        expect(await this.token.symbol()).to.equal(symbol);
    });

    it('token decimals are ' + decimals.toString(), async function () {
        expect(await this.token.decimals()).to.be.bignumber.equal(decimals);
    });

    it('initial totalSupply is 0', async function () {
        expect(await this.token.totalSupply()).to.be.bignumber.equal('0');
    });
});

describe('LuniverseGluwacoin_GluwaRole', function () {
    const [ deployer, other, another ] = accounts;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
    });

    /* GluwaRole related
    */
   it('deployer is a Gluwa', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
    });

    it('non-deployer is not a Gluwa', async function () {
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        expect(await this.token.isGluwa(another)).to.be.equal(false);
    });

    // addGluwa related
    it('Gluwa can add non-Gluwa and make it Gluwa', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        await this.token.addGluwa(other, { from : deployer });
        expect(await this.token.isGluwa(other)).to.be.equal(true);
    });

    it('Gluwa cannot add Gluwa again', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        await expectRevert(
            this.token.addGluwa(deployer, { from : deployer }),
            'Roles: account already has role'
        );
    });

    it('newly-added Gluwa can add non-Gluwa and make it Gluwa', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        await this.token.addGluwa(other, { from : deployer });

        expect(await this.token.isGluwa(other)).to.be.equal(true);
        expect(await this.token.isGluwa(another)).to.be.equal(false);
        await this.token.addGluwa(another, { from : other });

        expect(await this.token.isGluwa(another)).to.be.equal(true);
    });

    it('newly-added Gluwa cannot add Gluwa again', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        await this.token.addGluwa(other, { from : deployer });

        expect(await this.token.isGluwa(other)).to.be.equal(true);
        await expectRevert(
            this.token.addGluwa(deployer, { from : other }),
            'Roles: account already has role'
        );
    });

    it('newly-added Gluwa cannot add newly-added Gluwa again', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        expect(await this.token.isGluwa(another)).to.be.equal(false);
        await this.token.addGluwa(other, { from : deployer });
        await this.token.addGluwa(another, { from : deployer });

        expect(await this.token.isGluwa(other)).to.be.equal(true);
        expect(await this.token.isGluwa(another)).to.be.equal(true);
        await expectRevert(
            this.token.addGluwa(another, { from : other }),
            'Roles: account already has role'
        );
    });

    it('non-Gluwa cannot add non-Gluwa', async function () {
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        expect(await this.token.isGluwa(another)).to.be.equal(false);
        await expectRevert(
            this.token.addGluwa(another, { from : other }),
            'GluwaRole: caller does not have the Gluwa role'
        );
    });

    it('non-Gluwa cannot add Gluwa', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        await expectRevert(
            this.token.addGluwa(deployer, { from : other }),
            'GluwaRole: caller does not have the Gluwa role'
        );
    });

    // removeGluwa related
    it('Gluwa can remove Gluwa and make it non-Gluwa', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        await this.token.removeGluwa(deployer, { from : deployer });
        expect(await this.token.isGluwa(deployer)).to.be.equal(false);
    });

    it('newly-added Gluwa can remove Gluwa and make it non-Gluwa', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        await this.token.addGluwa(other, { from : deployer });

        expect(await this.token.isGluwa(other)).to.be.equal(true);
        await this.token.removeGluwa(deployer, { from : other });

        expect(await this.token.isGluwa(deployer)).to.be.equal(false);
    });

    it('newly-added Gluwa can remove newly-added Gluwa and make it non-Gluwa', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        expect(await this.token.isGluwa(another)).to.be.equal(false);
        await this.token.addGluwa(other, { from : deployer });
        await this.token.addGluwa(another, { from : deployer });

        expect(await this.token.isGluwa(other)).to.be.equal(true);
        expect(await this.token.isGluwa(another)).to.be.equal(true);
        await this.token.removeGluwa(another, { from : other });

        expect(await this.token.isGluwa(another)).to.be.equal(false);
    });

    it('non-Gluwa cannot remove Gluwa', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        await expectRevert(
            this.token.removeGluwa(deployer, { from : other }),
            'GluwaRole: caller does not have the Gluwa role'
        );
    });

    it('non-Gluwa cannot remove non-Gluwa', async function () {
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        expect(await this.token.isGluwa(another)).to.be.equal(false);
        await expectRevert(
            this.token.removeGluwa(another, { from : other }),
            'GluwaRole: caller does not have the Gluwa role'
        );
    });

    // renounceGluwa related
    it('Gluwa can renounce and become a non-Gluwa', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        await this.token.renounceGluwa({ from : deployer });
        expect(await this.token.isGluwa(deployer)).to.be.equal(false);
    });

    it('newly-added Gluwa can renounce and become a non-Gluwa', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        await this.token.addGluwa(other, { from : deployer });

        await this.token.renounceGluwa({ from : other });
        expect(await this.token.isGluwa(other)).to.be.equal(false);
    });

    it('non-Gluwa cannot renounce', async function () {
        await expectRevert(
            this.token.renounceGluwa({ from : other }),
            'Roles: account does not have role'
        );

    });
});

describe('LuniverseGluwacoin_LuniverseRole', function () {
    const [ deployer, other, another ] = accounts;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
    });

    /* LuniverseRole related
    */
   it('deployer is a Luniverse', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
    });

    it('non-deployer is not a Luniverse', async function () {
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        expect(await this.token.isLuniverse(another)).to.be.equal(false);
    });

    // addLuniverse related
    it('Luniverse can add non-Luniverse and make it Luniverse', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        await this.token.addLuniverse(other, { from : deployer });
        expect(await this.token.isLuniverse(other)).to.be.equal(true);
    });

    it('Luniverse cannot add Luniverse again', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        await expectRevert(
            this.token.addLuniverse(deployer, { from : deployer }),
            'Roles: account already has role'
        );
    });

    it('newly-added Luniverse can add non-Luniverse and make it Luniverse', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        await this.token.addLuniverse(other, { from : deployer });

        expect(await this.token.isLuniverse(other)).to.be.equal(true);
        expect(await this.token.isLuniverse(another)).to.be.equal(false);
        await this.token.addLuniverse(another, { from : other });

        expect(await this.token.isLuniverse(another)).to.be.equal(true);
    });

    it('newly-added Luniverse cannot add Luniverse again', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        await this.token.addLuniverse(other, { from : deployer });

        expect(await this.token.isLuniverse(other)).to.be.equal(true);
        await expectRevert(
            this.token.addLuniverse(deployer, { from : other }),
            'Roles: account already has role'
        );
    });

    it('newly-added Luniverse cannot add newly-added Luniverse again', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        expect(await this.token.isLuniverse(another)).to.be.equal(false);
        await this.token.addLuniverse(other, { from : deployer });
        await this.token.addLuniverse(another, { from : deployer });

        expect(await this.token.isLuniverse(other)).to.be.equal(true);
        expect(await this.token.isLuniverse(another)).to.be.equal(true);
        await expectRevert(
            this.token.addLuniverse(another, { from : other }),
            'Roles: account already has role'
        );
    });

    it('non-Luniverse cannot add non-Luniverse', async function () {
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        expect(await this.token.isLuniverse(another)).to.be.equal(false);
        await expectRevert(
            this.token.addLuniverse(another, { from : other }),
            'LuniverseRole: caller does not have the Luniverse role'
        );
    });

    it('non-Luniverse cannot add Luniverse', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        await expectRevert(
            this.token.addLuniverse(deployer, { from : other }),
            'LuniverseRole: caller does not have the Luniverse role'
        );
    });

    // removeLuniverse related
    it('Luniverse can remove Luniverse and make it non-Luniverse', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        await this.token.removeLuniverse(deployer, { from : deployer });
        expect(await this.token.isLuniverse(deployer)).to.be.equal(false);
    });

    it('newly-added Luniverse can remove Luniverse and make it non-Luniverse', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        await this.token.addLuniverse(other, { from : deployer });

        expect(await this.token.isLuniverse(other)).to.be.equal(true);
        await this.token.removeLuniverse(deployer, { from : other });

        expect(await this.token.isLuniverse(deployer)).to.be.equal(false);
    });

    it('newly-added Luniverse can remove newly-added Luniverse and make it non-Luniverse', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        expect(await this.token.isLuniverse(another)).to.be.equal(false);
        await this.token.addLuniverse(other, { from : deployer });
        await this.token.addLuniverse(another, { from : deployer });

        expect(await this.token.isLuniverse(other)).to.be.equal(true);
        expect(await this.token.isLuniverse(another)).to.be.equal(true);
        await this.token.removeLuniverse(another, { from : other });

        expect(await this.token.isLuniverse(another)).to.be.equal(false);
    });

    it('non-Luniverse cannot remove Luniverse', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        await expectRevert(
            this.token.removeLuniverse(deployer, { from : other }),
            'LuniverseRole: caller does not have the Luniverse role'
        );
    });

    it('non-Luniverse cannot remove non-Luniverse', async function () {
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        expect(await this.token.isLuniverse(another)).to.be.equal(false);
        await expectRevert(
            this.token.removeLuniverse(another, { from : other }),
            'LuniverseRole: caller does not have the Luniverse role'
        );
    });

    // renounceLuniverse related
    it('Luniverse can renounce and become a non-Luniverse', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        await this.token.renounceLuniverse({ from : deployer });
        expect(await this.token.isLuniverse(deployer)).to.be.equal(false);
    });

    it('newly-added Luniverse can renounce and become a non-Luniverse', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        await this.token.addLuniverse(other, { from : deployer });

        await this.token.renounceLuniverse({ from : other });
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
    });

    it('non-Luniverse cannot renounce', async function () {
        await expectRevert(
            this.token.renounceLuniverse({ from : other }),
            'Roles: account does not have role'
        );
    });
});

describe('LuniverseGluwacoin_PauserRole', function () {
    const [ deployer, other, another ] = accounts;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
    });

    /* PauserRole related
    */
   it('deployer is a Pauser', async function () {
        expect(await this.token.isPauser(deployer)).to.be.equal(true);
    });

    it('non-deployer is not a Pauser', async function () {
        expect(await this.token.isPauser(other)).to.be.equal(false);
        expect(await this.token.isPauser(another)).to.be.equal(false);
    });

    // addPauser related
    it('Pauser can add non-Pauser and make it Pauser', async function () {
        expect(await this.token.isPauser(deployer)).to.be.equal(true);
        expect(await this.token.isPauser(other)).to.be.equal(false);
        await this.token.addPauser(other, { from : deployer });
        expect(await this.token.isPauser(other)).to.be.equal(true);
    });

    it('newly-added Pauser can add non-Pauser and make it Pauser', async function () {
        expect(await this.token.isPauser(deployer)).to.be.equal(true);
        expect(await this.token.isPauser(other)).to.be.equal(false);
        await this.token.addPauser(other, { from : deployer });

        expect(await this.token.isPauser(other)).to.be.equal(true);
        expect(await this.token.isPauser(another)).to.be.equal(false);
        await this.token.addPauser(another, { from : other });

        expect(await this.token.isPauser(another)).to.be.equal(true);
    });

    it('non-Pauser cannot add Pauser', async function () {
        expect(await this.token.isPauser(other)).to.be.equal(false);
        await expectRevert(
            this.token.addPauser(another, { from : other }),
            'PauserRole: caller does not have the Pauser role'
        );
    });

    // renouncePauser related
    it('Pauser can renounce and become a non-Pauser', async function () {
        expect(await this.token.isPauser(deployer)).to.be.equal(true);
        await this.token.renouncePauser({ from : deployer });
        expect(await this.token.isPauser(deployer)).to.be.equal(false);
    });

    it('newly-added Pauser can renounce and become a non-Pauser', async function () {
        expect(await this.token.isPauser(deployer)).to.be.equal(true);
        expect(await this.token.isPauser(other)).to.be.equal(false);
        await this.token.addPauser(other, { from : deployer });

        await this.token.renouncePauser({ from : other });
        expect(await this.token.isPauser(other)).to.be.equal(false);
    });
});

describe('LuniverseGluwacoin_Peggable', function () {
    const [ deployer, other, pegSender ] = accounts;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    const pegTxnHash = '0x2ff883f947eda8a14f54d1e372b8031bb47d721dede68c8934f49f818efe8620';
    const invalidPegTxnHash = 'dummy';
    const pegAmount = new BN('1000');

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
    });
    /* Peggable related
    */
    // peg related
    it('Gluwa can peg', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        expect(await this.token.isPegged(pegTxnHash)).to.be.equal(true);
    });

    it('non-Gluwa or non-Luniverse cannot peg', async function () {
        await expectRevert(
            this.token.peg(pegTxnHash, pegAmount, pegSender, { from : other }),
            'Peggable: caller does not have the Gluwa role or the Luniverse role'
        );
    });

    it('cannot peg invalid pegTxnHash', async function () {
        await expectRevert(
            this.token.peg(invalidPegTxnHash, pegAmount, pegSender, { from : deployer }),
            'invalid bytes32 value'
        );
    });

    it('newly-added Gluwa can peg', async function () {
        expect(await this.token.isGluwa(deployer)).to.be.equal(true);
        expect(await this.token.isGluwa(other)).to.be.equal(false);
        await this.token.addGluwa(other, { from : deployer });
        expect(await this.token.isGluwa(other)).to.be.equal(true);
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : other });
        expect(await this.token.isPegged(pegTxnHash)).to.be.equal(true);
    });

    it('newly-added Luniverse can peg', async function () {
        expect(await this.token.isLuniverse(deployer)).to.be.equal(true);
        expect(await this.token.isLuniverse(other)).to.be.equal(false);
        await this.token.addLuniverse(other, { from : deployer });
        expect(await this.token.isLuniverse(other)).to.be.equal(true);
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : other });
        expect(await this.token.isPegged(pegTxnHash)).to.be.equal(true);
    });

    // getPeg related
    it('Gluwa can get an existing peg', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });

        var peg = await this.token.getPeg(pegTxnHash, { from : deployer });
        expect(peg.amount).to.be.bignumber.equal(pegAmount);
        expect(peg.sender).to.be.bignumber.equal(pegSender);
        expect(!peg.gluwaApproved);
        expect(!peg.luniverseApproved);
        expect(!peg.processed);
    });

    it('other can get an existing peg', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        var peg = await this.token.getPeg(pegTxnHash, { from : other });

        expect(peg.amount).to.be.bignumber.equal(pegAmount);
        expect(peg.sender).to.be.bignumber.equal(pegSender);
        expect(!peg.gluwaApproved);
        expect(!peg.luniverseApproved);
        expect(!peg.processed);
    });

    it('cannot get a non-existing peg', async function () {
        await expectRevert(
            this.token.getPeg(pegTxnHash, { from : deployer }),
            'Peggable: the txnHash is not pegged'
        );
    });

    // gluwaApprove related
    it('Gluwa can gluwaApprove', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });

        var peg = await this.token.getPeg(pegTxnHash, { from : deployer });
        expect(peg.gluwaApproved);
    });

    it('newly-added Gluwa can gluwaApprove', async function () {
        await this.token.addGluwa(other, { from : deployer });
        expect(await this.token.isGluwa(other)).to.be.equal(true);
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : other });
        await this.token.gluwaApprove(pegTxnHash, { from : other });

        var peg = await this.token.getPeg(pegTxnHash, { from : deployer });
        expect(peg.gluwaApproved);
    });

    it('Gluwa cannot gluwaApprove already gluwaApproved', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });

        var peg = await this.token.getPeg(pegTxnHash, { from : deployer });
        expect(peg.gluwaApproved);

        await expectRevert(
            this.token.gluwaApprove(pegTxnHash, { from : deployer }),
            'Peggable: the txnHash is already Gluwa Approved'
        );
    });

    it('Gluwa can gluwaApprove with peg from different address', async function () {
        await this.token.addGluwa(other, { from : deployer });
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        var peg = await this.token.gluwaApprove(pegTxnHash, { from : other });
        expect(peg.gluwaApproved);
    });

    it('Gluwa cannot gluwaApprove without peg', async function () {
        await expectRevert(
            this.token.gluwaApprove(pegTxnHash, { from : deployer }),
            'Peggable: the txnHash is not pegged'
        );
    });

    it('non-Gluwa cannot gluwaApprove', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await expectRevert(
            this.token.gluwaApprove(pegTxnHash, { from : other }),
            'GluwaRole: caller does not have the Gluwa role'
        );
    });

    it('Luniverse cannot gluwaApprove', async function () {
        await this.token.addLuniverse(other, { from : deployer });
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : other });
        await expectRevert(
            this.token.gluwaApprove(pegTxnHash, { from : other }),
            'GluwaRole: caller does not have the Gluwa role'
        );
    });

    // luniverseApprove related
    it('Luniverse can luniverseApprove', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        var peg = await this.token.getPeg(pegTxnHash, { from : deployer });
        expect(peg.luniverseApproved);
    });

    it('newly-added Luniverse can luniverseApprove', async function () {
        await this.token.addLuniverse(other, { from : deployer });
        expect(await this.token.isLuniverse(other)).to.be.equal(true);
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : other });
        await this.token.luniverseApprove(pegTxnHash, { from : other });

        var peg = await this.token.getPeg(pegTxnHash, { from : deployer });
        expect(peg.luniverseApproved);
    });

    it('Luniverse can luniverseApprove with peg from different address', async function () {
        await this.token.addLuniverse(other, { from : deployer });
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        var peg = await this.token.luniverseApprove(pegTxnHash, { from : other });
        expect(peg.luniverseApproved);
    });

    it('Luniverse cannot luniverseApprove already luniverseApproved', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        var peg = await this.token.getPeg(pegTxnHash, { from : deployer });
        expect(peg.luniverseApproved);

        await expectRevert(
            this.token.luniverseApprove(pegTxnHash, { from : deployer }),
            'Peggable: the txnHash is already Luniverse Approved'
        );
    });

    it('Luniverse cannot luniverseApprove without peg', async function () {
        await this.token.addLuniverse(other, { from : deployer });
        await expectRevert(
            this.token.luniverseApprove(pegTxnHash, { from : other }),
            'Peggable: the txnHash is not pegged'
        );
    });

    it('non-Luniverse cannot luniverseApprove', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await expectRevert(
            this.token.luniverseApprove(pegTxnHash, { from : other }),
            'LuniverseRole: caller does not have the Luniverse role.'
        );
    });

    it('Gluwa cannot luniverseApprove', async function () {
        await this.token.addGluwa(other, { from : deployer });
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : other });
        await expectRevert(
            this.token.luniverseApprove(pegTxnHash, { from : other }),
            'LuniverseRole: caller does not have the Luniverse role.'
        );
    });
});

describe('LuniverseGluwacoin_Mint', function () {
    const [ deployer, other, pegSender ] = accounts;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    const pegTxnHash = '0x2ff883f947eda8a14f54d1e372b8031bb47d721dede68c8934f49f818efe8620';
    const notPegTxnHash = '0x2ff883f947eda8a14f54d1e372b8031bb47d721dede68c8934f49f818efe8621';
    const pegAmount = new BN('1000');

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
    });

    // mint related
    it('Gluwa/Luniverse can mint', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });

        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal('0');

        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.mint(pegTxnHash, { from : deployer });
        expect(await this.token.totalSupply()).to.be.bignumber.equal(pegAmount);
        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal(pegAmount);

        var peg = await this.token.getPeg(pegTxnHash, { from : deployer });
        expect(peg.processed);
    });

    it('Gluwa/Luniverse mint emits a Transfer event', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        var receipt = await this.token.mint(pegTxnHash, { from : deployer });
        expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: pegSender, value: pegAmount });
    });

    it('Gluwa/Luniverse mint emits a Mint event', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        var receipt = await this.token.mint(pegTxnHash, { from : deployer });
        expectEvent(receipt, 'Mint', { _mintTo: pegSender, _value: pegAmount });
    });

    it('newly-added Gluwa can mint', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.addGluwa(other, { from : deployer });
        await this.token.mint(pegTxnHash, { from : other });

        var peg = await this.token.getPeg(pegTxnHash, { from : other });
        expect(peg.processed);

        expect(await this.token.totalSupply()).to.be.bignumber.equal(pegAmount);
        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal(pegAmount);
    });

    it('newly-added Luniverse can mint', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.addLuniverse(other, { from : deployer });
        await this.token.mint(pegTxnHash, { from : other });

        var peg = await this.token.getPeg(pegTxnHash, { from : other });
        expect(peg.processed);

        expect(await this.token.totalSupply()).to.be.bignumber.equal(pegAmount);
        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal(pegAmount);
    });

    it('Gluwa cannot mint already processed', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.mint(pegTxnHash, { from : deployer });

        await expectRevert(
            this.token.mint(pegTxnHash, { from : deployer }),
            'Peggable: the txnHash is already processed'
        );
    });

    it('Gluwa cannot mint with random 32bytes', async function () {
        await expectRevert(
            this.token.mint(notPegTxnHash, { from : deployer }),
            'Peggable: the txnHash is not pegged'
        );
    });

    it('Gluwa cannot mint without gluwaApproved peg', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await expectRevert(
            this.token.mint(pegTxnHash, { from : deployer }),
            'Peggable: the txnHash is not Gluwa Approved'
        );
    });

    it('Gluwa cannot mint without luniverseApproved peg', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });

        await expectRevert(
            this.token.mint(pegTxnHash, { from : deployer }),
            'Peggable: the txnHash is not Luniverse Approved'
        );
    });

    it('newly-added Gluwa cannot mint already processed', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.mint(pegTxnHash, { from : deployer });

        await this.token.addGluwa(other, { from : deployer });
        await expectRevert(
            this.token.mint(pegTxnHash, { from : other }),
            'Peggable: the txnHash is already processed'
        );
    });

    it('newly-added Gluwa cannot mint without gluwaApproved peg', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.addGluwa(other, { from : deployer });
        await expectRevert(
            this.token.mint(pegTxnHash, { from : other }),
            'Peggable: the txnHash is not Gluwa Approved'
        );
    });

    it('newly-added Gluwa cannot mint without luniverseApproved peg', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });

        await this.token.addGluwa(other, { from : deployer });
        await expectRevert(
            this.token.mint(pegTxnHash, { from : other }),
            'Peggable: the txnHash is not Luniverse Approved'
        );
    });

    it('newly-added Luniverse cannot mint already processed', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.mint(pegTxnHash, { from : deployer });

        await this.token.addLuniverse(other, { from : deployer });
        await expectRevert(
            this.token.mint(pegTxnHash, { from : other }),
            'Peggable: the txnHash is already processed'
        );
    });

    it('newly-added Luniverse cannot mint not gluwaApproved peg', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.addLuniverse(other, { from : deployer });
        await expectRevert(
            this.token.mint(pegTxnHash, { from : other }),
            'Peggable: the txnHash is not Gluwa Approved'
        );
    });

    it('newly-added Luniverse cannot mint not luniverseApproved peg', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });

        await this.token.addLuniverse(other, { from : deployer });
        await expectRevert(
            this.token.mint(pegTxnHash, { from : other }),
            'Peggable: the txnHash is not Luniverse Approved'
        );
    });
});

describe('LuniverseGluwacoin_Burn', function () {
    const [ deployer, other, another, pegSender ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey ] = privateKeys;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    const amount = new BN('5000');
    const fee = new BN('1');

    const pegTxnHash = '0x2ff883f947eda8a14f54d1e372b8031bb47d721dede68c8934f49f818efe8620';
    const pegAmount = new BN('1000');

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
    });
    /* Burnable related
    */
    // burn related
    it('can burn less than balance', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.mint(pegTxnHash, { from : deployer });
        expect(await this.token.totalSupply()).to.be.bignumber.equal(pegAmount);
        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal(pegAmount);

        const burnAmount = new BN('100');

        await this.token.burn(burnAmount, { from : pegSender });
        expect(await this.token.totalSupply()).to.be.bignumber.equal(pegAmount.sub(burnAmount));
        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal(pegAmount.sub(burnAmount));
    });

    it('can burn full balance', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.mint(pegTxnHash, { from : deployer });
        expect(await this.token.totalSupply()).to.be.bignumber.equal(pegAmount);
        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal(pegAmount);

        await this.token.burn(pegAmount, { from : pegSender });
        expect(await this.token.totalSupply()).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal('0');
    });

    it('cannot burn more than balance', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.mint(pegTxnHash, { from : deployer });
        expect(await this.token.totalSupply()).to.be.bignumber.equal(pegAmount);
        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal(pegAmount);

        const burnAmount = new BN('10000');

        await expectRevert(
            this.token.burn(burnAmount, { from : pegSender }),
            'Reservable: transfer amount exceeds unreserved balance'
        );
    });

    it('burn emits a Transfer event', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.mint(pegTxnHash, { from : deployer });
        expect(await this.token.totalSupply()).to.be.bignumber.equal(pegAmount);
        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal(pegAmount);

        const burnAmount = new BN('100');
        const receipt = await this.token.burn(burnAmount, { from: pegSender });

        expectEvent(receipt, 'Transfer', { from: pegSender, to: ZERO_ADDRESS, value: burnAmount });
    });

    it('burn emits a Burnt event', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await this.token.mint(pegTxnHash, { from : deployer });
        expect(await this.token.totalSupply()).to.be.bignumber.equal(pegAmount);
        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal(pegAmount);

        const burnAmount = new BN('100');
        const receipt = await this.token.burn(burnAmount, { from: pegSender });

        expectEvent(receipt, 'Burnt', { _burnFrom: pegSender, _value: burnAmount });
    });
});

describe('LuniverseGluwacoin_Reservable_Reserve', function () {
    const [ deployer, other, another ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey ] = privateKeys;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    const amount = new BN('5000');
    const fee = new BN('1');

    const pegTxnHash = '0x' + crypto.randomBytes(64).toString('hex').substring(64);
    const pegAmount = new BN('1000');

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
        // peg and mint {amount} to {other}
        await this.token.peg(pegTxnHash, amount, other, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : deployer });
        // {other}'s starting balance is {amount}
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount);
        // {deployer} starting balance is 0
        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
    });

    /* reserve() related
    */
    it('can call reserve() if amount + fee < full balance', async function () {
        var executor = deployer;
        var leftoverBalance = new BN('1');
        var reserve_amount = amount.sub(fee).sub(leftoverBalance);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another });

        // {other}'s balance is dropped to 0
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(leftoverBalance);
        // {other}'s reserved balance equals {amount}
        expect(await this.token.reservedOf(other)).to.be.bignumber.equal(reserve_amount.add(reserve_fee));

        var reserve = await this.token.getReservation(other, nonce);
        // ReservationStatus is set to `Active`
        expect(reserve.status).to.be.bignumber.equal(new BN('0'));
    });

    it('can call reserve() if amount + fee == full balance', async function () {
        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another });

        // {other}'s balance is dropped to 0
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(new BN('0'));
        // {other}'s reserved balance equals {amount}
        expect(await this.token.reservedOf(other)).to.be.bignumber.equal(amount);

        var reserve = await this.token.getReservation(other, nonce);
        // ReservationStatus is set to `Active`
        expect(reserve.status).to.be.bignumber.equal(new BN('0'));
    });

    it('cannot call reserve() with outdated expiryBlockNum', async function () {
        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock;
        var nonce = Date.now();

        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum);

        await expectRevert(
            this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another }),
            'Reservable: invalid block expiry number'
        );
    });

    it('cannot call reserve() with zero address as the executor', async function () {
        var executor = ZERO_ADDRESS;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock;
        var nonce = Date.now();

        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum);

        await expectRevert(
            this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another }),
            'Reservable: cannot execute from zero address'
        );
    });

    it('cannot call reserve() if amount + fee > full balance', async function () {
        var executor = deployer;
        var reserve_amount = amount.sub(fee).add(new BN('1'));
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum);

        await expectRevert(
            this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another }),
            'Reservable: insufficient unreserved balance'
        );
    });

    it('cannot call reserve() if amount + fee + reserved > full balance', async function () {
        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another });

        var newNonce = Date.now();
        var newSignature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, newNonce, expiryBlockNum);

        await expectRevert(
            this.token.reserve(other, another, executor, reserve_amount, reserve_fee, newNonce, expiryBlockNum, signature, { from: another }),
            'Reservable: insufficient unreserved balance'
        );
    });

    it('can call reserve() if amount + fee = 0', async function () {
        var executor = deployer;
        var reserve_amount = new BN('0')
        var reserve_fee = new BN('0');
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another });

        var reserve = await this.token.getReservation(other, nonce);
        // ReservationStatus is set to `Active`
        expect(reserve.status).to.be.bignumber.equal(new BN('0'));
    });

    it('cannot call reserve() if nonce is already used', async function () {
        // mint another {amount} to {other}
        // generate a random txnHash that is different from pegTxnHash
        var newPegTxnHash = pegTxnHash;
        while (newPegTxnHash == pegTxnHash) {
            newPegTxnHash = '0x' + crypto.randomBytes(64).toString('hex').substring(64);
        }
        // peg and mint {amount} to {other}
        await this.token.peg(newPegTxnHash, amount, other, { from : deployer });
        await this.token.gluwaApprove(newPegTxnHash, { from : deployer });
        await this.token.luniverseApprove(newPegTxnHash, { from : deployer });
        await this.token.mint(newPegTxnHash, { from : deployer });
        // {other}'s starting balance is {amount} * 2
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount.mul(new BN('2')));

        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another });

        await expectRevert(
            this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another }),
            'Reservable: the sender used the nonce already'
        );
    });

    it('cannot call reserve() if signature is invalid', async function () {
        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.signReserve(this.token.address, other, another_privateKey, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum);

        await expectRevert(
            this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another }),
            'Validate: invalid signature'
        );
    });

    /* getReservation() related
    */
    it('getReservation() returns newly created reservation correctly', async function () {
        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another });

        var reserve = await this.token.getReservation(other, nonce);

        expect(reserve.amount).to.be.bignumber.equal(reserve_amount);
        expect(reserve.fee).to.be.bignumber.equal(reserve_fee);
        expect(reserve.recipient).to.equal(another);
        expect(reserve.executor).to.equal(executor);
        expect(reserve.expiryBlockNum).to.be.bignumber.equal(expiryBlockNum);
        expect(reserve.status).to.be.bignumber.equal(new BN('0'));
    });
});

describe('LuniverseGluwacoin_Reservable_Execute', function () {
    const [ deployer, other, another ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey ] = privateKeys;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    const amount = new BN('5000');
    const fee = new BN('1');

    const pegTxnHash = '0x' + crypto.randomBytes(64).toString('hex').substring(64);
    const pegAmount = new BN('1000');

    const sender = other;
    const executor = deployer;
    const reserve_amount = amount.sub(fee);
    const reserve_fee = fee;
    const nonce = Date.now();

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
        // peg and mint {amount} to {other}
        await this.token.peg(pegTxnHash, amount, other, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : deployer });
        // {other}'s starting balance is {amount}
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount);
        // {executor} starting balance is 0
        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
        // create a reserve
        var latestBlock = await time.latestBlock();
        this.expiryBlockNum = latestBlock.add(new BN('100'));
        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, this.expiryBlockNum);
        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, this.expiryBlockNum, signature, { from: another });
        // {other}'s balance is dropped to 0
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(new BN('0'));
        // {other}'s reserved balance equals {amount}
        expect(await this.token.reservedOf(other)).to.be.bignumber.equal(amount);

        var reserve = await this.token.getReservation(other, nonce);
        // ReservationStatus is set to `Active`
        expect(reserve.status).to.be.bignumber.equal(new BN('0'));
    });

    /* execute() related
    */
    it('executor can call execute()', async function () {
        await this.token.execute(other, nonce, { from: executor });

        // {other}'s balance stays 0
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(new BN('0'));
        // {other}'s reserved balance is dropped to 0
        expect(await this.token.reservedOf(other)).to.be.bignumber.equal(new BN('0'));
        // {another}'s balance equals {reserve_amount}
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal(reserve_amount);
        // {executor}'s balance equals {reserve_fee}
        expect(await this.token.balanceOf(executor)).to.be.bignumber.equal(reserve_fee);

        var reserve = await this.token.getReservation(other, nonce);
        // ReservationStatus is set to `Executed`
        expect(reserve.status).to.be.bignumber.equal(new BN('2'));
    });

    it('sender can call execute()', async function () {
        await this.token.execute(other, nonce, { from: sender });

        // {other}'s balance stays 0
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(new BN('0'));
        // {other}'s reserved balance is dropped to 0
        expect(await this.token.reservedOf(other)).to.be.bignumber.equal(new BN('0'));
        // {another}'s balance equals {reserve_amount}
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal(reserve_amount);
        // {executor}'s balance equals {reserve_fee}
        expect(await this.token.balanceOf(executor)).to.be.bignumber.equal(reserve_fee);

        var reserve = await this.token.getReservation(other, nonce);
        // ReservationStatus is set to `Executed`
        expect(reserve.status).to.be.bignumber.equal(new BN('2'));
    });

    it('non-executor and non-sender cannot call execute()', async function () {
        await expectRevert(
            this.token.execute(other, nonce, { from: another }),
            'Reservable: this address is not authorized to execute this reservation'
        );
    });

    it('executor cannot call execute() if the reserve is expired', async function () {
        // expire the reserve
        await time.advanceBlockTo(this.expiryBlockNum.add(new BN('1')));

        await expectRevert(
            this.token.execute(other, nonce, { from: executor }),
            'Reservable: reservation has expired and cannot be executed'
        );
    });

    it('sender cannot call execute() if the reserve is expired', async function () {
        // expire the reserve
        await time.advanceBlockTo(this.expiryBlockNum.add(new BN('1')));

        await expectRevert(
            this.token.execute(other, nonce, { from: sender }),
            'Reservable: reservation has expired and cannot be executed'
        );
    });

    it('non-executor and non-sender cannot call execute() if the reserve is expired', async function () {
        // expire the reserve
        await time.advanceBlockTo(this.expiryBlockNum.add(new BN('1')));

        await expectRevert(
            this.token.execute(other, nonce, { from: another }),
            'Reservable: this address is not authorized to execute this reservation'
        );
    });

    it('executor cannot call execute() if the reserve is already executed by executor', async function () {
        await this.token.execute(other, nonce, { from: executor });

        await expectRevert(
            this.token.execute(other, nonce, { from: executor }),
            'Reservable: invalid reservation status to execute'
        );
    });

    it('executor cannot call execute() if the reserve is already executed by sender', async function () {
        await this.token.execute(other, nonce, { from: sender });

        await expectRevert(
            this.token.execute(other, nonce, { from: executor }),
            'Reservable: invalid reservation status to execute'
        );
    });

    it('sender cannot call execute() if the reserve is already executed by executor', async function () {
        await this.token.execute(other, nonce, { from: executor });

        await expectRevert(
            this.token.execute(other, nonce, { from: sender }),
            'Reservable: invalid reservation status to execute'
        );
    });

    it('sender cannot call execute() if the reserve is already executed by sender', async function () {
        await this.token.execute(other, nonce, { from: sender });

        await expectRevert(
            this.token.execute(other, nonce, { from: sender }),
            'Reservable: invalid reservation status to execute'
        );
    });

    it('executor cannot call execute() if the reserve is reclaimed by executor', async function () {
        await this.token.reclaim(other, nonce, { from: executor });

        await expectRevert(
            this.token.execute(other, nonce, { from: executor }),
            'Reservable: invalid reservation status to execute'
        );
    });

    it('executor cannot call execute() if the reserve is reclaimed by sender', async function () {
        // expire the reserve
        await time.advanceBlockTo(this.expiryBlockNum.add(new BN('1')));

        await this.token.reclaim(other, nonce, { from: sender });

        await expectRevert(
            this.token.execute(other, nonce, { from: sender }),
            'Reservable: reservation has expired and cannot be executed'
        );
    });

    it('sender cannot call execute() if the reserve is reclaimed by executor', async function () {
        await this.token.reclaim(other, nonce, { from: executor });

        await expectRevert(
            this.token.execute(other, nonce, { from: sender }),
            'Reservable: invalid reservation status to execute'
        );
    });

    it('sender cannot call execute() if the reserve is reclaimed by sender', async function () {
        // expire the reserve
        await time.advanceBlockTo(this.expiryBlockNum.add(new BN('1')));

        await this.token.reclaim(other, nonce, { from: sender });

        await expectRevert(
            this.token.execute(other, nonce, { from: sender }),
            'Reservable: reservation has expired and cannot be executed'
        );
    });

    it('executor cannot call execute() on a non-existing reserve', async function () {
        // create a new nonce without a reserve
        var newNonce = nonce;
        while (newNonce == nonce) {
            newNonce = Date.now();
        }

        await expectRevert(
            this.token.execute(other, newNonce, { from: executor }),
            'Reservable: reservation does not exist'
        );
    });

    it('sender cannot call execute() on a non-existing reserve', async function () {
        // create a new nonce without a reserve
        var newNonce = nonce;
        while (newNonce == nonce) {
            newNonce = Date.now();
        }

        await expectRevert(
            this.token.execute(other, newNonce, { from: sender }),
            'Reservable: reservation does not exist'
        );
    });

    it('non-executor and non-sender cannot call execute() on a non-existing reserve', async function () {
        // create a new nonce without a reserve
        var newNonce = nonce;
        while (newNonce == nonce) {
            newNonce = Date.now();
        }

        await expectRevert(
            this.token.execute(other, newNonce, { from: another }),
            'Reservable: reservation does not exist'
        );
    });

    it('executor cannot call execute() when the reserve is already executed', async function () {
        await this.token.execute(other, nonce, { from: executor });

        await expectRevert(
            this.token.execute(other, nonce, { from: executor }),
            'Reservable: invalid reservation status to execute'
        );
    });

    it('sender cannot call execute() when the reserve is already executed', async function () {
        await this.token.execute(other, nonce, { from: executor });

        await expectRevert(
            this.token.execute(other, nonce, { from: sender }),
            'Reservable: invalid reservation status to execute'
        );
    });

    it('non-executor and non-sender cannot call execute() when the reserve is already executed', async function () {
        await this.token.execute(other, nonce, { from: executor });

        await expectRevert(
            this.token.execute(other, nonce, { from: another }),
            'Reservable: this address is not authorized to execute this reservation'
        );
    });

    it('executor cannot call execute() when the reserve is already reclaimed', async function () {
        await this.token.reclaim(other, nonce, { from: executor });

        await expectRevert(
            this.token.execute(other, nonce, { from: executor }),
            'Reservable: invalid reservation status to execute'
        );
    });

    it('sender cannot call execute() when the reserve is already reclaimed', async function () {
        await this.token.reclaim(other, nonce, { from: executor });

        await expectRevert(
            this.token.execute(other, nonce, { from: sender }),
            'Reservable: invalid reservation status to execute'
        );
    });

    it('non-executor and non-sender cannot call execute() when the reserve is already reclaimed', async function () {
        await this.token.reclaim(other, nonce, { from: executor });

        await expectRevert(
            this.token.execute(other, nonce, { from: another }),
            'Reservable: this address is not authorized to execute this reservation'
        );
    });
});

describe('LuniverseGluwacoin_Reservable_Reclaim', function () {
    const [ deployer, other, another ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey ] = privateKeys;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    const amount = new BN('5000');
    const fee = new BN('1');

    const pegTxnHash = '0x' + crypto.randomBytes(64).toString('hex').substring(64);
    const pegAmount = new BN('1000');

    const sender = other;
    const executor = deployer;
    const reserve_amount = amount.sub(fee);
    const reserve_fee = fee;
    const nonce = Date.now();

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
        // peg and mint {amount} to {other}
        await this.token.peg(pegTxnHash, amount, other, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : deployer });
        // {other}'s starting balance is {amount}
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount);
        // {executor} starting balance is 0
        expect(await this.token.balanceOf(executor)).to.be.bignumber.equal('0');
        // create a reserve
        var latestBlock = await time.latestBlock();
        this.expiryBlockNum = latestBlock.add(new BN('100'));
        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, this.expiryBlockNum);
        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, this.expiryBlockNum, signature, { from: another });
        // {other}'s balance is dropped to 0
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(new BN('0'));
        // {other}'s reserved balance equals {amount}
        expect(await this.token.reservedOf(other)).to.be.bignumber.equal(amount);
    });

    /* reclaim() related
    */
    it('executor can call reclaim() when the reserve is NOT expired', async function () {
        await this.token.reclaim(other, nonce, { from: executor });

        // {other}'s balance is back to {amount}
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount);
        // {other}'s reserved balance is dropped to 0
        expect(await this.token.reservedOf(other)).to.be.bignumber.equal(new BN('0'));
        // {another}'s balance stays 0
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal(new BN('0'));
        // {executor}'s balance stays 0
        expect(await this.token.balanceOf(executor)).to.be.bignumber.equal(new BN('0'));

        var reserve = await this.token.getReservation(other, nonce);
        // ReservationStatus is set to `Reclaimed`
        expect(reserve.status).to.be.bignumber.equal(new BN('1'));
    });

    it('executor can call reclaim() when the reserve is expired', async function () {
        // expire the reserve
        await time.advanceBlockTo(this.expiryBlockNum.add(new BN('1')));

        await this.token.reclaim(other, nonce, { from: executor });

        // {other}'s balance is back to {amount}
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount);
        // {other}'s reserved balance is dropped to 0
        expect(await this.token.reservedOf(other)).to.be.bignumber.equal(new BN('0'));
        // {another}'s balance stays 0
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal(new BN('0'));
        // {executor}'s balance stays 0
        expect(await this.token.balanceOf(executor)).to.be.bignumber.equal(new BN('0'));

        var reserve = await this.token.getReservation(other, nonce);
        // ReservationStatus is set to `Reclaimed`
        expect(reserve.status).to.be.bignumber.equal(new BN('1'));
    });

    it('sender can call reclaim() when the reserve is expired', async function () {
        // expire the reserve
        await time.advanceBlockTo(this.expiryBlockNum.add(new BN('1')));

        await this.token.reclaim(other, nonce, { from: sender });

        // {other}'s balance is back to {amount}
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount);
        // {other}'s reserved balance is dropped to 0
        expect(await this.token.reservedOf(other)).to.be.bignumber.equal(new BN('0'));
        // {another}'s balance stays 0
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal(new BN('0'));
        // {executor}'s balance stays 0
        expect(await this.token.balanceOf(executor)).to.be.bignumber.equal(new BN('0'));

        var reserve = await this.token.getReservation(other, nonce);
        // ReservationStatus is set to `Reclaimed`
        expect(reserve.status).to.be.bignumber.equal(new BN('1'));
    });

    it('sender cannot call reclaim() when the reserve is NOT expired', async function () {
        await expectRevert(
            this.token.reclaim(other, nonce, { from: sender }),
            'Reservable: reservation has not expired or you are not the executor and cannot be reclaimed'
        );
    });

    it('non-executor and non-sender cannot call reclaim() when the reserve is NOT expired', async function () {
        await expectRevert(
            this.token.reclaim(other, nonce, { from: another }),
            'Reservable: only the sender or the executor can reclaim the reservation back to the sender'
        );
    });

    it('non-executor and non-sender cannot call reclaim() when the reserve is expired', async function () {
        // expire the reserve
        await time.advanceBlockTo(this.expiryBlockNum.add(new BN('1')));

        await expectRevert(
            this.token.reclaim(other, nonce, { from: another }),
            'Reservable: only the sender or the executor can reclaim the reservation back to the sender'
        );
    });

    it('executor cannot call reclaim() on a non-existing reserve', async function () {
        // create a new nonce without a reserve
        var newNonce = nonce;
        while (newNonce == nonce) {
            newNonce = Date.now();
        }

        await expectRevert(
            this.token.reclaim(other, newNonce, { from: executor }),
            'Reservable: reservation does not exist'
        );
    });

    it('sender cannot call reclaim() on a non-existing reserve', async function () {
        // create a new nonce without a reserve
        var newNonce = nonce;
        while (newNonce == nonce) {
            newNonce = Date.now();
        }

        await expectRevert(
            this.token.reclaim(other, newNonce, { from: sender }),
            'Reservable: reservation does not exist'
        );
    });

    it('non-executor and non-sender cannot call reclaim() on a non-existing reserve', async function () {
        // create a new nonce without a reserve
        var newNonce = nonce;
        while (newNonce == nonce) {
            newNonce = Date.now();
        }

        await expectRevert(
            this.token.reclaim(other, newNonce, { from: another }),
            'Reservable: reservation does not exist'
        );
    });

    it('executor cannot call reclaim() when the reserve is already executed', async function () {
        await this.token.execute(other, nonce, { from: executor });

        await expectRevert(
            this.token.reclaim(other, nonce, { from: executor }),
            'Reservable: invalid reservation status to reclaim'
        );
    });

    it('sender cannot call reclaim() when the reserve is already executed', async function () {
        await this.token.execute(other, nonce, { from: executor });

        await expectRevert(
            this.token.reclaim(other, nonce, { from: sender }),
            'Reservable: invalid reservation status to reclaim'
        );
    });

    it('non-executor and non-sender cannot call reclaim() when the reserve is already executed', async function () {
        await this.token.execute(other, nonce, { from: executor });

        await expectRevert(
            this.token.reclaim(other, nonce, { from: another }),
            'Reservable: invalid reservation status to reclaim'
        );
    });

    it('executor cannot call reclaim() when the reserve is already reclaimed', async function () {
        await this.token.reclaim(other, nonce, { from: executor });

        await expectRevert(
            this.token.reclaim(other, nonce, { from: executor }),
            'Reservable: invalid reservation status to reclaim'
        );
    });

    it('sender cannot call reclaim() when the reserve is already reclaimed', async function () {
        await this.token.reclaim(other, nonce, { from: executor });

        await expectRevert(
            this.token.reclaim(other, nonce, { from: sender }),
            'Reservable: invalid reservation status to reclaim'
        );
    });

    it('non-executor and non-sender cannot call reclaim() when the reserve is already reclaimed', async function () {
        await this.token.reclaim(other, nonce, { from: executor });

        await expectRevert(
            this.token.reclaim(other, nonce, { from: another }),
            'Reservable: invalid reservation status to reclaim'
        );
    });
});

describe('LuniverseGluwacoin_Reservable_BalanceOf', function () {
    const [ deployer, other, another ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey ] = privateKeys;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    const amount = new BN('5000');
    const fee = new BN('1');

    const pegTxnHash = '0x' + crypto.randomBytes(64).toString('hex').substring(64);
    const pegAmount = new BN('1000');

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
        // peg and mint {amount} to {other}
        await this.token.peg(pegTxnHash, amount, other, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : deployer });
    });

    /* balanceOf() related
    */
    it('balanceOf() accurate before reserve()', async function () {
        // {other}'s starting balance is {amount}
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount);
        // {deployer} starting balance is 0
        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal('0');
    });

    it('balanceOf() accurate after reserve() when amount + fee < full balance', async function () {
        var executor = deployer;
        var leftoverBalance = new BN('1');
        var reserve_amount = amount.sub(fee).sub(leftoverBalance);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another });

        // {other}'s balance is dropped to 0
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(leftoverBalance);
        // {other}'s reserved balance equals {amount}
        expect(await this.token.reservedOf(other)).to.be.bignumber.equal(reserve_amount.add(reserve_fee));
    });

    it('balanceOf() accurate after reserve() when amount + fee == full balance', async function () {
        var executor = deployer;
        var reserve_amount = amount.sub(fee);
        var reserve_fee = fee;
        var latestBlock = await time.latestBlock();
        var expiryBlockNum = latestBlock.add(new BN('100'));
        var nonce = Date.now();

        var signature = sign.signReserve(this.token.address, other, other_privateKey, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum);

        await this.token.reserve(other, another, executor, reserve_amount, reserve_fee, nonce, expiryBlockNum, signature, { from: another });

        // {other}'s balance is dropped to 0
        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(new BN('0'));
        // {other}'s reserved balance equals {amount}
        expect(await this.token.reservedOf(other)).to.be.bignumber.equal(amount);
    });
});

describe('LuniverseGluwacoin_ETHless', function () {
    const [ deployer, other, another, pegSender ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey, pegSender_privateKey ] = privateKeys;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    const amount = new BN('5000');
    const fee = new BN('1');

    const pegTxnHash = '0x2ff883f947eda8a14f54d1e372b8031bb47d721dede68c8934f49f818efe8620';
    const pegAmount = new BN('1000');

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
    });
    /* ETHless related
    */
    it('can send transfer', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : deployer });

        await this.token.methods['transfer(address,uint256)'](other, pegAmount, { from: pegSender });
    });

    it('Gluwa can send ETHless transfer', async function () {
        await this.token.peg(pegTxnHash, amount, other, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : deployer });

        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount);
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal('0');

        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, amount.sub(fee), fee, nonce);

        await this.token.transfer(other, another, amount.sub(fee), fee, nonce, signature, { from: deployer });

        expect(await this.token.balanceOf(deployer)).to.be.bignumber.equal(fee);
        expect(await this.token.totalSupply()).to.be.bignumber.equal(amount);

        expect(await this.token.balanceOf(other)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal(amount.sub(fee));
    });

    it('newly-added Gluwa can send ETHless transfer', async function () {
        await this.token.addGluwa(other, { from : deployer });

        await this.token.peg(pegTxnHash, amount, pegSender, { from : other });
        await this.token.gluwaApprove(pegTxnHash, { from : other });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : other });

        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal(amount);
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal('0');

        var nonce = Date.now();

        var signature = sign.sign(this.token.address, pegSender, pegSender_privateKey, another, amount.sub(fee), fee, nonce);

        await this.token.transfer(pegSender, another, amount.sub(fee), fee, nonce, signature, { from: other });

        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(fee);
        expect(await this.token.totalSupply()).to.be.bignumber.equal(amount);

        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal(amount.sub(fee));
    });

    it('newly-added Luniverse cannot send ETHless transfer', async function () {
        await this.token.addLuniverse(other, { from : deployer });

        await this.token.peg(pegTxnHash, amount, pegSender, { from : other });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : other });

        await this.token.mint(pegTxnHash, { from : other });

        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal(amount);
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal('0');

        var nonce = Date.now();

        var signature = sign.sign(this.token.address, pegSender, pegSender_privateKey, another, amount.sub(fee), fee, nonce);
        
        await expectRevert(
            this.token.transfer(pegSender, another, amount.sub(fee), fee, nonce, signature, { from: other }),
            "caller does not have the Gluwa role"
        );

        expect(await this.token.balanceOf(other)).to.be.bignumber.equal('0');
        expect(await this.token.totalSupply()).to.be.bignumber.equal(amount);

        expect(await this.token.balanceOf(pegSender)).to.be.bignumber.equal(amount);
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal('0');
    });

    it('Gluwa cannot send ETHless transfer with wrong signature', async function () {
        await this.token.peg(pegTxnHash, amount, other, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : deployer });

        var nonce = Date.now();
        var wrongSignature = sign.sign(this.token.address, other, other_privateKey, another, amount, fee, nonce);

        await expectRevert(
            this.token.transfer(other, another, amount.sub(fee), fee, nonce, wrongSignature, { from: deployer }),
            'Validate: invalid signature'
        );
    });

    it('Gluwa cannot send ETHless transfer with used nonce', async function () {
        var mintAmount = amount.add(amount);
        await this.token.peg(pegTxnHash, mintAmount, other, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : deployer });

        expect(await this.token.balanceOf(other)).to.be.bignumber.equal(mintAmount);
        expect(await this.token.balanceOf(another)).to.be.bignumber.equal('0');

        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, amount.sub(fee), fee, nonce);

        await this.token.transfer(other, another, amount.sub(fee), fee, nonce, signature, { from: deployer });
        await expectRevert(
            this.token.transfer(other, another, amount.sub(fee), fee, nonce, signature, { from: deployer }),
            'ETHless: the nonce has already been used for this address'
        );
    });

    it('non-Gluwa cannot send ETHless transfer', async function () {
        await this.token.peg(pegTxnHash, amount, other, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : deployer });

        var nonce = Date.now();

        var signature = sign.sign(this.token.address, other, other_privateKey, another, amount.sub(fee), fee, nonce);

        await expectRevert(
            this.token.transfer(other, another, amount.sub(fee), fee, nonce, signature, { from: another }),
            'GluwaRole: caller does not have the Gluwa role'
        );
    });
});

describe('LuniverseGluwacoin_Pausable', function () {
    const [ deployer, other ] = accounts;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
        // verify that the contract is not paused
        expect(await this.token.paused()).to.be.equal(false);
        // verify that deployer is a Pauser
        expect(await this.token.isPauser(deployer)).to.be.equal(true);
        // verify that deployer is a not Pauser
        expect(await this.token.isPauser(other)).to.be.equal(false);
    });

    // pause related
    it('Pauser can pause', async function () {
        await this.token.pause({ from : deployer });
        expect(await this.token.paused()).to.be.equal(true);
    });

    it('Pauser cannot pause already paused', async function () {
        await this.token.pause({ from : deployer });
        await expectRevert(
            this.token.pause({ from : deployer }),
            "Pausable: paused"
        );
    });

    it('non-Pauser cannot pause', async function () {
        await expectRevert(
            this.token.pause({ from : other }),
            "PauserRole: caller does not have the Pauser role"
        );
    });

    // unpause related
    it('Pauser can unpause', async function () {
        await this.token.pause({ from : deployer });
        expect(await this.token.paused()).to.be.equal(true);
        await this.token.unpause({ from : deployer });
        expect(await this.token.paused()).to.be.equal(false);
    });

    it('Pauser cannot unpause not paused', async function () {
        await expectRevert(
            this.token.unpause({ from : deployer }),
            "Pausable: not paused"
        );
    });

    it('non-Pauser cannot unpause', async function () {
        await this.token.pause({ from : deployer });
        expect(await this.token.paused()).to.be.equal(true);
        await expectRevert(
            this.token.pause({ from : other }),
            "PauserRole: caller does not have the Pauser role"
        );
    });
});

describe('LuniverseGluwacoin_ERC20Pausable', function () {
    const [ deployer, other, another, pegSender ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey, pegSender_privateKey ] = privateKeys;

    const name = 'LuniverseGluwacoin';
    const symbol = 'LG';
    const decimals = new BN('18');
    const amount = new BN('5000');
    const fee = new BN('1');
    const pegTxnHash = '0x2ff883f947eda8a14f54d1e372b8031bb47d721dede68c8934f49f818efe8620';
    const pegAmount = new BN('1000');

    beforeEach(async function () {
        // Deploy a new LuniverseGluwacoin contract for each test
        this.token = await LuniverseGluwacoin.new(name, symbol, decimals, { from : deployer });
        // verify that the contract is not paused
        expect(await this.token.paused()).to.be.equal(false);
        // verify that deployer is a Pauser
        expect(await this.token.isPauser(deployer)).to.be.equal(true);
        // verify that deployer is a not Pauser
        expect(await this.token.isPauser(other)).to.be.equal(false);
    });

    // pause related
    it('cannot mint when paused', async function () {
        await this.token.pause({ from : deployer });
        expect(await this.token.paused()).to.be.equal(true);

        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });

        await expectRevert(
            this.token.mint(pegTxnHash, { from : deployer }),
            "ERC20Pausable: token transfer while paused"
        );
    });

    it('cannot burn when paused', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : deployer });

        await this.token.pause({ from : deployer });
        expect(await this.token.paused()).to.be.equal(true);

        await expectRevert(
            this.token.burn(pegAmount, { from : pegSender }),
            "ERC20Pausable: token transfer while paused"
        );
    });

    it('cannot transfer when paused', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : deployer });

        await this.token.pause({ from : deployer });
        expect(await this.token.paused()).to.be.equal(true);

        await expectRevert(
            this.token.methods['transfer(address,uint256)'](other, pegAmount, { from: pegSender }),
            "ERC20Pausable: token transfer while paused"
        );
    });

    it('cannot ETHless transfer when paused', async function () {
        await this.token.peg(pegTxnHash, pegAmount, pegSender, { from : deployer });
        await this.token.gluwaApprove(pegTxnHash, { from : deployer });
        await this.token.luniverseApprove(pegTxnHash, { from : deployer });
        await this.token.mint(pegTxnHash, { from : deployer });

        await this.token.pause({ from : deployer });
        expect(await this.token.paused()).to.be.equal(true);

        var nonce = Date.now();
        var signature = sign.sign(this.token.address, pegSender, pegSender_privateKey, other, amount.sub(fee), fee, nonce);

        await expectRevert(
            this.token.transfer(pegSender, other, amount.sub(fee), fee, nonce, signature, { from: deployer }),
            "ERC20Pausable: token transfer while paused"
        );
    });
});