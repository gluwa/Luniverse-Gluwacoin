// SPDX-License-Identifier: MIT

pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "./BeforeTransferERC20.sol";

/**
 * @dev Extension of {ERC20} that allows users to burn its token or burnFrom its allowance.
 */
contract Burnable is ContextUpgradeable, BeforeTransferERC20 {

    event Burnt(address indexed _burnFrom, uint256 _value);

    function __ERC20Burnable_init() internal onlyInitializing {
        __ERC20Burnable_init_unchained();
    }
    function __ERC20Burnable_init_unchained() internal onlyInitializing {
    }

    function _burn(address account, uint256 amount) override virtual internal {
        emit Burnt(account, amount);
        super._burn(account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev See {ERC20-_burnFrom}.
     */
    function burnFrom(address account, uint256 amount) public {

        _burnFrom(account, amount);
    }
    
    uint256[50] private __gap;
}