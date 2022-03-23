// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "./BeforeTransferERC20.sol";
import "../libs/GluwacoinModels.sol";
import "../Validate.sol";
import "../roles/GluwaRole.sol";

/**
 * @dev Extension of {ERC20} that allows users to send ETHless transfer by hiring a transaction relayer to pay the
 * gas fee for them. The relayer gets paid in this ERC20 token for `fee`.
 */
contract ETHlessTransfer is BeforeTransferERC20, GluwaRole {
    using ECDSAUpgradeable for bytes32;

    function __ETHlessTransfer_init() internal onlyInitializing {
        __ETHlessTransfer_init_unchained();
    }

    function __ETHlessTransfer_init_unchained() internal onlyInitializing {
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
        _useNonce(sender, 3, nonce); // 3 - Transfer
        uint256 chainId = chainId();
        bytes32 hash = keccak256(abi.encodePacked(GluwacoinModels.SigDomain.Transfer, chainId, address(this), 
        sender, recipient, amount, fee, nonce));

        Validate.validateSignature(hash, sender, sig);

        _collect(sender, fee);
        _transfer(sender, recipient, amount);

        return true;
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