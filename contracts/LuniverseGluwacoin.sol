// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;


import "./abstracts/ETHlessTransfer.sol";
import "./abstracts/Peggable.sol";
import "./abstracts/Reservable.sol";
import "./abstracts/ERC20Pausable.sol";
import "./abstracts/Initializable.sol";
import "./roles/GluwaRole.sol";
import "./roles/LuniverseRole.sol";

/**
 * @dev Extension of {ERC20} that adds a set of accounts with the {MinterRole},
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract LuniverseGluwacoin is Initializable,ERC20Pausable,GluwaRole, LuniverseRole, Peggable, Reservable, ETHlessTransfer {
    function initialize(string memory name, string memory symbol, uint8 decimals) public {
        _LuniverseGluwacoin_init_unchained(name, symbol, decimals);
        _addGluwa(msg.sender);
        _addLuniverse(msg.sender);
    }
    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) external {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev See {ERC20-_burnFrom}.
     */
    function burnFrom(address account, uint256 amount) external {
        _burnFrom(account, amount);
    }
    uint256[50] private __gap;

 
}
