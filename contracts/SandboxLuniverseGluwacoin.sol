// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./abstracts/ETHlessTransfer.sol";
import "./abstracts/Peggable.sol";
import "./abstracts/Reservable.sol";
import "./abstracts/ERC20Pausable.sol";
/**
 * @dev Luniverse Gluwacoin for Sandbox
 */
contract SandboxLuniverseGluwacoin is ERC20Pausable, Peggable, Reservable, ETHlessTransfer {
    // constructor(string memory name, string memory symbol, uint8 decimals) public
    // BeforeTransferERC20(name, symbol, decimals) GluwaRole(msg.sender) LuniverseRole(msg.sender) {}
    function initialize(string memory name, string memory symbol, uint8 decimals) public {
        _tokenInit(name, symbol, decimals);
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
