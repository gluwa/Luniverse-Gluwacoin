// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./abstracts/Burnable.sol";
import "./abstracts/ETHlessTransfer.sol";
import "./abstracts/Peggable.sol";
import "./abstracts/Reservable.sol";
import "./roles/GluwaRole.sol"; 
import "./roles/LuniverseRole.sol";
/**
 * @dev Extension of {ERC20} that adds a set of accounts with the {MinterRole},
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract LuniverseGluwacoin is PausableUpgradeable, GluwaRole, LuniverseRole, Burnable, Peggable, Reservable, ETHlessTransfer {

    function initialize(string memory name, string memory symbol, uint8 decimals) public initializer {
        __LuniverseGluwacoin_init_unchained(name, symbol, decimals);
    }

    function __LuniverseGluwacoin_init_unchained(string memory name, string memory symbol, uint8 decimals) internal onlyInitializing {
        __Context_init();
        __GluwaRole_init();
        __LuniverseRole_init();
        __BeforeTransferERC20_init(name, symbol, decimals);
        __Pausable_init();
        __ERC20Burnable_init();
        __ETHlessTransfer_init();
        __Peggable_init();
        __Reservable_init();
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) {        
        super._pause();
        return super.paused();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) {        
        super._unpause();
        return super.paused();
    }

    function balanceOf(address account) public view override(Reservable, ERC20Upgradeable) returns (uint256) {
        return super.balanceOf(account);
    }

    function _burn(address account, uint256 amount) override(Burnable, ERC20Upgradeable) internal {
        super._burn(account, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) override(Reservable, ERC20Upgradeable) internal {
        require(!super.paused(), "ERC20Pausable: token transfer while paused");

        return super._beforeTokenTransfer(from, to, amount);
    }

    function reserve(address sender, address recipient, address executor, uint256 amount, uint256 fee, uint256 nonce,
        uint256 expiryBlockNum, bytes memory sig) override public whenNotPaused returns (bool success) {
        _useNonce(sender, 4, nonce); // 4 - Reserve
        return super.reserve(sender,recipient,executor,amount,fee, nonce,expiryBlockNum,sig);
    }

    function burn(
        address burner,
        uint256 amount,
        uint256 fee,
        uint256 nonce,
        bytes calldata sig
    ) external whenNotPaused {
        uint256 burnerBalance = balanceOf(burner);
        require(
            burnerBalance >= amount,
            "ERC20Wrapper: burn amount exceed balance"
        );
        _useNonce(burner, 1, nonce); // 1 - Burn
        uint256 chainId = chainId();
        bytes32 hash = keccak256(
            abi.encodePacked(
                GluwacoinModels.SigDomain.Burn,
                chainId,
                address(this),
                burner,
                amount,
                fee,
                nonce
            )
        );
        Validate.validateSignature(hash, burner, sig);
        _collect(burner, fee);
        uint256 burnedAmount;
        unchecked {
            burnedAmount = amount - fee;
        }
        _burn(burner, burnedAmount);
    }
    
    uint256[50] private __gap;
}
