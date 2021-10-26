// // SPDX-License-Identifier: MIT
// pragma solidity ^0.5.0;

// import "@openzeppelin/contracts/GSN/Context.sol";
// import "@openzeppelin/contracts/utils/Address.sol";
// import "./BeforeTransferERC20.sol";

// /**
//  * @dev Extension of {ERC20} that allows users to burn its token or burnFrom its allowance.
//  */
// contract Burnable is Context, BeforeTransferERC20 {
//     using Address for address;

//     event Burnt(address indexed _burnFrom, uint256 _value);

//     /**
//      * @dev Destroys `amount` tokens from the caller.
//      *
//      * See {ERC20-_burn}.
//      */
//     function burn(uint256 amount) public {
//         emit Burnt(_msgSender(), amount);

//         _burn(_msgSender(), amount);
//     }

//     /**
//      * @dev See {ERC20-_burnFrom}.
//      */
//     function burnFrom(address account, uint256 amount) public {
//         emit Burnt(account, amount);

//         _burnFrom(account, amount);
//     }
// }