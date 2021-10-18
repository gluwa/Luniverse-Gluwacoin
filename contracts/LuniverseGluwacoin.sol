// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;


import "./abstracts/ETHlessTransfer.sol";
import "./abstracts/Peggable.sol";
import "./abstracts/Reservable.sol";
import "./abstracts/ERC20Pausable.sol";

/**
 * @dev Extension of {ERC20} that adds a set of accounts with the {MinterRole},
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract LuniverseGluwacoin is ERC20Pausable, Peggable, Reservable, ETHlessTransfer {

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
