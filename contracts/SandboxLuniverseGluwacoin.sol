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
contract SandboxLuniverseGluwacoin is Initializable,ERC20Pausable, Peggable, Reservable, ETHlessTransfer {
    // constructor(string memory name, string memory symbol, uint8 decimals) public
    // BeforeTransferERC20(name, symbol, decimals) GluwaRole(msg.sender) LuniverseRole(msg.sender) {}
    function initialize(string memory name, string memory symbol, uint8 decimals) public {
        _SandboxLuniverse_init_unchained(name, symbol, decimals);
        _addGluwa(msg.sender);
        _addLuniverse(msg.sender);

    }
    function _SandboxLuniverse_init_unchained(string memory name, string memory symbol, uint8 decimals)internal initializer{
        _init_unchained(name, symbol, decimals);
        _addGluwa(msg.sender);
        _addLuniverse(msg.sender);
    }
    event Burnt(address indexed _burnFrom, uint256 _value);

    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) public {
        emit Burnt(_msgSender(), amount);

        _burn(_msgSender(), amount);
    }

    /**
     * @dev See {ERC20-_burnFrom}.
     */
    function burnFrom(address account, uint256 amount) public {
        emit Burnt(account, amount);

        _burnFrom(account, amount);
    }

}
