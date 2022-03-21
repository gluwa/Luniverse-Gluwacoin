// SPDX-License-Identifier: MIT

pragma solidity 0.8.12;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

/**
 * @dev Extension of {ERC20} that allows users to burn its token or burnFrom its allowance.
 */
contract BeforeTransferERC20 is ContextUpgradeable, ERC20Upgradeable {

    uint8 private _decimals;
    
    mapping (address => mapping (uint8 => mapping (uint256 => bool))) private _usedNonces;

    function __BeforeTransferERC20_init(string memory name_, string memory symbol_, uint8 decimals_) internal onlyInitializing {
        __BeforeTransferERC20_init_unchained(name_, symbol_, decimals_);
    }

    function __BeforeTransferERC20_init_unchained(string memory name_, string memory symbol_, uint8 decimals_) internal onlyInitializing {
        __ERC20_init(name_, symbol_);
        _decimals = decimals_;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
     * overridden;
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function chainId()public view returns(uint256){
        return block.chainid;
    }
    
    /**
     * @dev Used by ETHLess transaction
     */
    function _useNonce(address signer, uint8 domain, uint256 nonce) internal {
        require(!_usedNonces[signer][domain][nonce], "ETHless: the nonce has already been used for this address");
        _usedNonces[signer][domain][nonce] = true;
    }

    /**
     * @dev Destroys `amount` tokens from `account`.`amount` is then deducted
     * from the caller's allowance.
     *
     * See {_burn} and {_approve}.
     */
    function _burnFrom(address account, uint256 amount) internal {
        _burn(account, amount);
        _spendAllowance(account, _msgSender(), amount);
    }
    

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[45] private __gap;
}
