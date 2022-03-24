// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "./BeforeTransferERC20.sol";
import "../roles/GluwaRole.sol";
import "../roles/LuniverseRole.sol";

/**
 * @dev Extension of {ERC20} that allows users to 2-way peg tokens from a sidechain of Luniverse, the Ethereum.
 * When the fund is sent to a gateway contract on Ethereum, either Gluwa or Luniverse can add a `peg`.
 * The `peg` has to get approved by both Gluwa and Luniverse before getting processed
 * --minting Gluwacoins corresponding to the peg.
 * Also, only Gluwa or Luniverse can process approved pegs.
 * You cannot process a peg more than once.
 */
contract Peggable is BeforeTransferERC20, GluwaRole, LuniverseRole {
    function __Peggable_init() internal onlyInitializing {
        __GluwaRole_init_unchained();
        __LuniverseRole_init_unchained();
        __Peggable_init_unchained();
    }

    function __Peggable_init_unchained() internal onlyInitializing {
    }
    
    struct Peg {
        uint256 _amount;
        address _sender;
        bool _gluwaApproved;
        bool _luniverseApproved;
        bool _processed;
    }

    // transactionHash mapping to Peg.
    mapping (bytes32 => Peg) private _pegged;

    event Mint(address indexed _mintTo, uint256 _value);

    function isPegged(bytes32 txnHash) public view returns (bool pegged) {
        if (_pegged[txnHash]._sender != address(0)) {
            return true;
        }

        return false;
    }

    function getPeg(bytes32 txnHash) public view returns (uint256 amount, address sender, bool gluwaApproved,
        bool luniverseApproved, bool processed) {
        require(_pegged[txnHash]._sender != address(0), "Peggable: the txnHash is not pegged");

        Peg memory pullPeg = _pegged[txnHash];

        amount = pullPeg._amount;
        sender = pullPeg._sender;
        gluwaApproved = pullPeg._gluwaApproved;
        luniverseApproved = pullPeg._luniverseApproved;
        processed = pullPeg._processed;
    }

    function peg(bytes32 txnHash, uint256 amount, address sender) public {
        require(_pegged[txnHash]._sender == address(0), "Peggable: the txnHash is already pegged");
        require(isGluwa(_msgSender()) || isLuniverse(_msgSender()),
            "Peggable: caller does not have the Gluwa role or the Luniverse role");

        _pegged[txnHash] = Peg(amount, sender, false, false, false);
    }

    function gluwaApprove(bytes32 txnHash) public onlyGluwa {
        require(_pegged[txnHash]._sender != address(0), "Peggable: the txnHash is not pegged");
        require(!_pegged[txnHash]._gluwaApproved, "Peggable: the txnHash is already Gluwa Approved");

        _pegged[txnHash]._gluwaApproved = true;
    }

    function luniverseApprove(bytes32 txnHash) public onlyLuniverse {
        require(_pegged[txnHash]._sender != address(0), "Peggable: the txnHash is not pegged");
        require(!_pegged[txnHash]._luniverseApproved, "Peggable: the txnHash is already Luniverse Approved");

        _pegged[txnHash]._luniverseApproved = true;
    }

    /**
     * @dev See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the Peg must be Gluwa Approved and Luniverse Approved.
     * - the caller must have the Gluwa role or the Luniverse role.
     */
    function mint(bytes32 txnHash) public returns (bool) {
        require(_pegged[txnHash]._sender != address(0), "Peggable: the txnHash is not pegged");
        require(isGluwa(_msgSender()) || isLuniverse(_msgSender()),
            "Peggable: caller does not have the Gluwa role or the Luniverse role");

        _processPeg(txnHash);

        address account = _pegged[txnHash]._sender;
        uint256 amount = _pegged[txnHash]._amount;

        emit Mint(account, amount);

        _mint(account, amount);

        return true;
    }

    function _processPeg(bytes32 txnHash) internal {
        require(_pegged[txnHash]._sender != address(0), "Peggable: the txnHash is not pegged");
        require(_pegged[txnHash]._gluwaApproved, "Peggable: the txnHash is not Gluwa Approved");
        require(_pegged[txnHash]._luniverseApproved, "Peggable: the txnHash is not Luniverse Approved");
        require(!_pegged[txnHash]._processed, "Peggable: the txnHash is already processed");

        _pegged[txnHash]._processed = true;
    }
    
    uint256[50] private __gap;
}