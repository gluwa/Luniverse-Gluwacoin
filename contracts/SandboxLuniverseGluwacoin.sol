// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./abstracts/ERC20Pausable.sol";
import "./abstracts/Burnable.sol";
import "./abstracts/ETHlessTransfer.sol";
import "./abstracts/SandboxPeggable.sol";
import "./abstracts/Reservable.sol";
import "./roles/GluwaRole.sol";
import "./roles/LuniverseRole.sol";

/**
 * @dev Luniverse Gluwacoin for Sandbox
 */
contract SandboxLuniverseGluwacoin is ERC20Pausable, GluwaRole, LuniverseRole, Burnable, SandboxPeggable, Reservable, ETHlessTransfer {
function initialize(string memory name, string memory symbol, uint8 decimals) public {
        _tokenInit(name, symbol, decimals);
        _addGluwa(msg.sender);
        _addLuniverse(msg.sender);

    }

}
