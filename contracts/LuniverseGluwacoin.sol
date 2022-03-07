// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./abstracts/ERC20Pausable.sol";
import "./abstracts/Burnable.sol";
import "./abstracts/ETHlessTransfer.sol";
import "./abstracts/Peggable.sol";
import "./abstracts/Reservable.sol";
import "./roles/GluwaRole.sol"; 
import "./roles/LuniverseRole.sol";
import "./abstracts/Initializable.sol";
/**
 * @dev Extension of {ERC20} that adds a set of accounts with the {MinterRole},
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract LuniverseGluwacoin is Initializable, ERC20Pausable, GluwaRole, LuniverseRole, Burnable, Peggable, Reservable, ETHlessTransfer {
    // constructor(string memory name, string memory symbol, uint8 decimals) public
    // BeforeTransferERC20(name, symbol, decimals) GluwaRole(msg.sender) LuniverseRole(msg.sender) {}
        function initialize(string memory name, string memory symbol, uint8 decimals, uint256 chainId) public {
        __LuniverseGluwacoin_init_unchained(name, symbol, decimals, chainId);
    }
    function __LuniverseGluwacoin_init_unchained(string memory name, string memory symbol, uint8 decimals, uint256 chainId)internal initializer{
        __Context_init_unchained();
        __GluwaRole_init_unchained();
        __LuniverseRole_init_unchained();
        __BeforeTransferERC20_init_unchained(name, symbol, decimals, chainId);
        __ETHlessTransfer_init_unchained();
        __Peggable_init_unchained();
        __Reservable_init_unchained();
        _addGluwa(_msgSender());
        _addLuniverse(_msgSender());
    }

    function reserve(address sender, address recipient, address executor, uint256 amount, uint256 fee, uint256 nonce,
        uint256 expiryBlockNum, bytes memory sig) public whenNotPaused returns (bool success) {
        _useNonce(sender, 4, nonce); // 4 - Reserve
        return super.reserve(sender,recipient,executor,amount,fee, nonce,expiryBlockNum,sig);
    }

    function burn(
        address burner,
        uint256 amount,
        uint256 fee,
        uint256 nonce,
        bytes calldata sig
    ) external {
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
        _burn(burner, amount.sub(fee));
    }
    
    uint256[50] private __gap;
}
