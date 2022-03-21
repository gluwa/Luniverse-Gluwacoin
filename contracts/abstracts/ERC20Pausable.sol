// SPDX-License-Identifier: MIT

pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./BeforeTransferERC20.sol";

/**
 * @dev ERC20 token with pausable token transfers, minting and burning.
 *
 * Useful for scenarios such as preventing trades until the end of an evaluation
 * period, or having an emergency switch for freezing all token transfers in the
 * event of a large bug.
 */
contract ERC20Pausable is BeforeTransferERC20, PausableUpgradeable {

    function __ERC20Pausable_init() internal onlyInitializing {
        __ERC20Pausable_init_unchained();
    }
    function __ERC20Pausable_init_unchained() internal onlyInitializing {
        __Pausable_init();
    }

    /**
     * @dev See {ERC20-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - the contract must not be paused.
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) virtual override internal {
        super._beforeTokenTransfer(from, to, amount);

        require(!paused(), "ERC20Pausable: token transfer while paused");
    }
    
    uint256[50] private __gap;
}
