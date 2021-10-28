// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./ContextUpgradeable.sol";
import "./ERC20Upgradeable.sol";
import "../Validate.sol";
import "../roles/AllRoles.sol";

/**
 * @dev Extension of {ERC20} that allows users to send ETHless transfer by hiring a transaction relayer to pay the
 * gas fee for them. The relayer gets paid in this ERC20 token for `fee`.
 */
contract ETHlessTransfer is ContextUpgradeable, ERC20Upgradeable, AllRoles {

    mapping (address => mapping (uint256 => bool)) private _usedNonces;

    function __ETHlessTransfer_init(string memory name_, string memory symbol_, uint8 decimals_) internal initializer {
        __Context_init_unchained();
        __ERC20_init_unchained(name_, symbol_, decimals_);
        __AllRoles_init_unchained();
        __ETHlessTransfer_init_unchained();
    }

    function __ETHlessTransfer_init_unchained() internal initializer {
    }

    /**
     * @dev Moves `amount` tokens from the `sender`'s account to `recipient`
     * and moves `fee` tokens from the `sender`'s account to a relayer's address.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits two {Transfer} events.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the `sender` must have a balance of at least the sum of `amount` and `fee`.
     * - the `nonce` is only used once per `sender`.
     */
    function transfer(address sender, address recipient, uint256 amount, uint256 fee, uint256 nonce, bytes memory sig)
    public onlyGluwa returns (bool success) {
        _useNonce(sender, nonce);

        bytes32 hash = keccak256(abi.encodePacked(address(this), sender, recipient, amount, fee, nonce));
        Validate.validateSignature(hash, sender, sig);

        _collect(sender, fee);
        _transfer(sender, recipient, amount);

        return true;
    }

    /* @dev Uses `nonce` for the signer.
    */
    function _useNonce(address signer, uint256 nonce) private {
        require(!_usedNonces[signer][nonce], "ETHless: the nonce has already been used for this address");
        _usedNonces[signer][nonce] = true;
    }

    /** @dev Collects `fee` from the sender.
     *
     * Emits a {Transfer} event.
     */
    function _collect(address sender, uint256 amount) internal {
        _transfer(sender, _msgSender(), amount);
    }
    uint256[50] private __gap;
}