// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./abstracts/ETHlessTransfer.sol";
import "./abstracts/Peggable.sol";
import "./abstracts/Reservable.sol";
import "./abstracts/ERC20Pausable.sol";
import "./abstracts/Initializable.sol";
/**
 * @dev Luniverse Gluwacoin for Sandbox
 */
contract SandboxLuniverseGluwacoin is Initializable ,AllRoles, ETHlessTransfer, Peggable, Reservable {
        function initialize(string memory name, string memory symbol, uint8 decimals) public {
        __Context_init_unchained();
        __AllRoles_init_unchained();
        __ERC20_init_unchained(name, symbol, decimals);
        __ETHlessTransfer_init_unchained();
        __Peggable_init_unchained();
        __Reservable_init_unchained();
        _addRole(_msgSender(), "Gluwa");
        _addRole(_msgSender(), "Luniverse");
    }

    uint256[50] private __gap;


}
