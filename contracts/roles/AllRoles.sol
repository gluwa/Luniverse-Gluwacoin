// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "@openzeppelin/contracts/access/Roles.sol";
import "../abstracts/ContextUpgradeable.sol";

contract AllRoles is ContextUpgradeable {
    using Roles for Roles.Role;
    
    event GluwaAdded(address indexed account);
    event GluwaRemoved(address indexed account);
    event LuniverseAdded(address indexed account);
    event LuniverseRemoved(address indexed account);

    Roles.Role private _Luniverses;
    Roles.Role private _Gluwas;

    function __Roles_init() internal initializer {
        __Context_init_unchained();
        __AllRoles_init_unchained();
    }

    function __AllRoles_init_unchained() internal initializer {
    }
    modifier onlyLuniverse() {
        require(isLuniverse(_msgSender()), "LuniverseRole: caller does not have the Luniverse role");
        _;
    }

    function isLuniverse(address account) public view returns (bool) {
        return _Luniverses.has(account);
    }
    modifier onlyGluwa() {
        require(isGluwa(_msgSender()), "GluwaRole: caller does not have the Gluwa role");
        _;
    }

    function isGluwa(address account) public view returns (bool) {
        return _Gluwas.has(account);
    }
    function addRole(address account, string memory role) public onlyLuniverse {
        _addRole(account, role);
    }

    function removeRole(address account, string memory role) public onlyLuniverse {
        _removeRole(account, role);
    }

    function renounceRole(string memory role) public {
        _removeRole(_msgSender(), role);
    }

    function _addRole(address account, string memory role) internal {
        if(keccak256(bytes(role)) == keccak256(bytes("Gluwa"))){
            _Gluwas.add(account);
            emit GluwaAdded(account);
        }else if(keccak256(bytes(role)) == keccak256(bytes("Luniverse"))){
            _Luniverses.add(account);
            emit LuniverseAdded(account);
        }
    }

    function _removeRole(address account, string memory role) internal {
        if(keccak256(bytes(role)) == keccak256(bytes("Gluwa"))){
            _Gluwas.remove(account);
            emit GluwaRemoved(account);
        }else if(keccak256(bytes(role)) == keccak256(bytes("Luniverse"))){
            _Luniverses.remove(account);
            emit LuniverseRemoved(account);
        }
    }
    uint256[50] private __gap;
}
