// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract LuniverseRole is AccessControlUpgradeable {

    // ADMIN -> DEFAULT_ADMIN_ROLE
    bytes32 public constant LUNIVERSE_ROLE = keccak256("LUNIVERSE_ROLE");

    event LuniverseAdded(address indexed account);
    event LuniverseRemoved(address indexed account);

    function __LuniverseRole_init() internal onlyInitializing {
        __LuniverseRole_init_unchained();
    }

    function __LuniverseRole_init_unchained() internal onlyInitializing {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _addLuniverse(_msgSender());
    }

    modifier onlyLuniverse() {
        require(isLuniverse(_msgSender()), "LuniverseRole: caller does not have the Luniverse role");
        _;
    }

    function isLuniverse(address account) public view returns (bool) {
        return hasRole(LUNIVERSE_ROLE, account);
    }

    function addLuniverse(address account) public onlyLuniverse {
        _addLuniverse(account);
    }

    function removeLuniverse(address account) public onlyLuniverse {
        _removeLuniverse(account);
    }

    function renounceLuniverse() public {
        _renounceLuniverse(_msgSender());
    }

    function _addLuniverse(address account) internal {
        grantRole(LUNIVERSE_ROLE, account);
        emit LuniverseAdded(account);
    }

    function _removeLuniverse(address account) internal {
        revokeRole(LUNIVERSE_ROLE, account);
        emit LuniverseRemoved(account);
    }

    function _renounceLuniverse(address account) internal {
        renounceRole(LUNIVERSE_ROLE, account);
        emit LuniverseRemoved(account);
    }
    
    uint256[50] private __gap;
}
