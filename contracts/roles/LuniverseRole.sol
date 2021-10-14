// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "@openzeppelin/contracts/access/Roles.sol";
import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract LuniverseRole is Context {
    using Address for address;
    using Roles for Roles.Role;

    event LuniverseAdded(address indexed account);
    event LuniverseRemoved(address indexed account);

    Roles.Role private _Luniverses;

    // constructor(address sender) public {
    //     if (!isLuniverse(sender)) {
    //         _addLuniverse(sender);
    //     }
    // }

    modifier onlyLuniverse() {
        require(isLuniverse(_msgSender()), "LuniverseRole: caller does not have the Luniverse role");
        _;
    }

    function isLuniverse(address account) public view returns (bool) {
        return _Luniverses.has(account);
    }

    function addLuniverse(address account) public onlyLuniverse {
        _addLuniverse(account);
    }

    function removeLuniverse(address account) public onlyLuniverse {
        _removeLuniverse(account);
    }

    function renounceLuniverse() public {
        _removeLuniverse(_msgSender());
    }

    function _addLuniverse(address account) internal {
        _Luniverses.add(account);
        emit LuniverseAdded(account);
    }

    function _removeLuniverse(address account) internal {
        _Luniverses.remove(account);
        emit LuniverseRemoved(account);
    }
}
