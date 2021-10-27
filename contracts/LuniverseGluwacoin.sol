// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;


import "./abstracts/ETHlessTransfer.sol";
import "./abstracts/Peggable.sol";
import "./abstracts/Reservable.sol";
// import "./abstracts/ERC20Pausable.sol";
import "./abstracts/Pausable.sol";


import "./abstracts/Initializable.sol";
import "./roles/AllRoles.sol";
// import "./roles/LuniverseRole.sol";

/**
 * @dev Extension of {ERC20} that adds a set of accounts with the {MinterRole},
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract LuniverseGluwacoin is Initializable ,AllRoles, ETHlessTransfer, Peggable, Reservable {
    function initialize(string memory name, string memory symbol, uint8 decimals) public {
        __Context_init_unchained();
        __AllRoles_init_unchained();
        __ERC20_init_unchained(name, symbol, decimals);
        __ETHlessTransfer_init_unchained();
        __Peggable_init_unchained();
        __Reservable_init_unchained();
        _addRole(msg.sender, true);
        _addRole(msg.sender, false);
    }

    uint256[50] private __gap;

 
}
