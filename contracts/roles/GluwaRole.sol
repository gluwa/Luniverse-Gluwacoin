// SPDX-License-Identifier: MIT

pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract GluwaRole is AccessControlUpgradeable {
    
    // ADMIN -> DEFAULT_ADMIN_ROLE
    bytes32 public constant GLUWA_ROLE = keccak256("GLUWA_ROLE");

    event GluwaAdded(address indexed account);
    event GluwaRemoved(address indexed account);

    function __GluwaRole_init() internal onlyInitializing {
        __GluwaRole_init_unchained();
    }

    function __GluwaRole_init_unchained() internal onlyInitializing {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _addGluwa(_msgSender());
    }

    modifier onlyGluwa() {
        require(isGluwa(_msgSender()), "GluwaRole: caller does not have the Gluwa role");
        _;
    }

    function isGluwa(address account) public view returns (bool) {
        return hasRole(GLUWA_ROLE, account);
    }

    function addGluwa(address account) public onlyGluwa {
        _addGluwa(account);
    }

    function removeGluwa(address account) public onlyGluwa {
        _removeGluwa(account);
    }

    function renounceGluwa() public {
        _renounceGluwa(_msgSender());
    }

    function _addGluwa(address account) internal {
        grantRole(GLUWA_ROLE, account);
        emit GluwaAdded(account);
    }

    function _renounceGluwa(address account) private {
        renounceRole(GLUWA_ROLE, account);
        emit GluwaRemoved(account);
    }

    function _removeGluwa(address account) internal {
        revokeRole(GLUWA_ROLE, account);
        emit GluwaRemoved(account);
    }
    
    uint256[50] private __gap;
}
