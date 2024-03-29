// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "@openzeppelin/contracts/cryptography/ECDSA.sol";

/**
 * @dev Signature verification
 */
library Validate {
    // using Address for address;
    using ECDSA for bytes32;

    /**
     * @dev Throws if given `sig` is an incorrect signature of the `sender`.
     */
    function validateSignature(bytes32 hash, address sender, bytes memory sig) internal pure returns (bool) {
        bytes32 messageHash = hash.toEthSignedMessageHash();

        address signer = messageHash.recover(sig);
        require(signer == sender, "Validate: invalid signature");

        return true;
    }
}
