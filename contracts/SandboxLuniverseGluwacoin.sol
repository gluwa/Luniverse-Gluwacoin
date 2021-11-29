// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./abstracts/ETHlessTransfer.sol";
import "./abstracts/Peggable.sol";
import "./abstracts/Reservable.sol";
import "./abstracts/Pausable.sol";
import "./abstracts/Initializable.sol";
import "./abstracts/ERC20Pausable.sol";
import "./abstracts/Burnable.sol";

import "./roles/LuniverseRole.sol";
import "./roles/GluwaRole.sol";
/**
 * @dev Luniverse Gluwacoin for Sandbox
 */
contract SandboxLuniverseGluwacoin is Initializable,ERC20Pausable ,GluwaRole, LuniverseRole, Burnable,ETHlessTransfer, Peggable, Reservable {
    function initialize(string memory name, string memory symbol, uint8 decimals) public {
        __SandboxLuniverseGluwacoin_init_unchained(name, symbol, decimals);
    }
    function __SandboxLuniverseGluwacoin_init_unchained(string memory name, string memory symbol, uint8 decimals)internal initializer{
        __Context_init_unchained();
        __GluwaRole_init_unchained();
        __LuniverseRole_init_unchained();
        __BeforeTransferERC20_init_unchained(name, symbol, decimals);
        __ETHlessTransfer_init_unchained();
        __Peggable_init_unchained();
        __Reservable_init_unchained();
        _addGluwa(_msgSender());
        _addLuniverse(_msgSender());
    }

    uint256[50] private __gap;


}
