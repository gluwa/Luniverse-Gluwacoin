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
    // constructor(string memory name, string memory symbol, uint8 decimals) public
    // BeforeTransferERC20(name, symbol, decimals) GluwaRole(msg.sender) LuniverseRole(msg.sender) {}
        function initialize(string memory name, string memory symbol, uint8 decimals, uint256 chainId) public {
        __SandboxLuniverseGluwacoin_init_unchained(name, symbol, decimals, chainId);
    }
    function __SandboxLuniverseGluwacoin_init_unchained(string memory name, string memory symbol, uint8 decimals, uint256 chainId)internal initializer{
        __Context_init_unchained();
        __GluwaRole_init_unchained();
        __LuniverseRole_init_unchained();
        __BeforeTransferERC20_init_unchained(name, symbol, decimals, chainId);
        __ETHlessTransfer_init_unchained();
        __SandboxPeggable_init_unchained();
        __Reservable_init_unchained();
        _addGluwa(_msgSender());
        _addLuniverse(_msgSender());
    }
    uint256[50] private __gap;

}
