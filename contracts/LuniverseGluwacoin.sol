// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./contract-upgradeable/utils/ContextUpgradeable.sol";
import "./contract-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./contract-upgradeable/proxy/utils/Initializable.sol";

import "./abstracts/ERC20Pausable.sol";
import "./abstracts/Burnable.sol";
import "./abstracts/ETHlessTransfer.sol";
import "./abstracts/Peggable.sol";
import "./abstracts/Reservable.sol";
import "./roles/GluwaRole.sol";
import "./roles/LuniverseRole.sol";

/**
 * @dev Extension of {ERC20} that adds a set of accounts with the {MinterRole},
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract LuniverseGluwacoin is Initializable,ERC20Pausable, GluwaRole, LuniverseRole, Burnable, Peggable, Reservable, ETHlessTransfer {
    // constructor(string memory name, string memory symbol, uint8 decimals) public
    // BeforeTransferERC20(name, symbol, decimals) GluwaRole(msg.sender) LuniverseRole(msg.sender) {}

    function initialize(string memory name, string memory symbol, uint8 decimals) public {
        _tokenInit(name, symbol, decimals);
        _addGluwa(msg.sender);
        _addLuniverse(msg.sender);

    }

 
}
