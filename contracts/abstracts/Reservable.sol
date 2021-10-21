// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

// import "@openzeppelin/contracts/math/SafeMath.sol";
// import "@openzeppelin/contracts/cryptography/ECDSA.sol";
// import "@openzeppelin/contracts/utils/Address.sol";

import "./BeforeTransferERC20.sol";
import "../Validate.sol";

/**
 * @dev Extension of {ERC20} that allows users to escrow a transfer. When the fund is reserved, the sender designates
 * an `executor` of the `reserve`. The `executor` can `release` the fund to the pre-defined `recipient` and collect
 * a `fee`. If the `reserve` gets expired without getting executed, the `sender` or the `executor` can `reclaim`
 * the fund back to the `sender`.
 */
contract Reservable is BeforeTransferERC20 {
    // using Address for address;
    // using ECDSA for bytes32;

    enum ReservationStatus {
        Active,
        Reclaimed,
        Completed
    }

    struct Reservation {
        uint256 _amount;
        uint256 _fee;
        address _recipient;
        address _executor;
        uint256 _expiryBlockNum;
        ReservationStatus _status;
    }

    // Address mapping to mapping of nonce to amount and expiry for that nonce.
    mapping (address => mapping(uint256 => Reservation)) private _reserved;

    // Total amount of reserved balance for address
    mapping (address => uint256) private _totalReserved;

    function getReservation(address sender, uint256 nonce) public view returns (uint256 amount, uint256 fee,
        address recipient, address executor, uint256 expiryBlockNum, ReservationStatus status) {
        Reservation memory reservation = _reserved[sender][nonce];

        amount = reservation._amount;
        fee = reservation._fee;
        recipient = reservation._recipient;
        executor = reservation._executor;
        expiryBlockNum = reservation._expiryBlockNum;
        status = reservation._status;
    }

    /**
     * @dev Returns the amount of tokens owned by `account` deducted by the reserved amount.
     */
    function balanceOf(address account) public view returns (uint256) {
        return _unreservedBalance(account);
    }

    /**
     * @dev Returns the total amount of tokens reserved from `account`.
     */
    function reservedOf(address account) public view returns (uint256 amount) {
        return _totalReserved[account];
    }

    function reserve(address sender, address recipient, address executor, uint256 amount, uint256 fee, uint256 nonce,
        uint256 expiryBlockNum, bytes memory sig) public returns (bool success) {
        require(executor != address(0), "Reservable: cannot execute from zero address");
        require(expiryBlockNum > block.number, "Reservable: invalid block expiry number");
        require(_reserved[sender][nonce]._expiryBlockNum == 0, "Reservable: the sender used the nonce already");

        uint256 total = amount.add(fee);
        require(total >= 0, "Reservable: invalid reserve amount");
        require(_unreservedBalance(sender) >= total, "Reservable: insufficient unreserved balance");

        bytes32 hash = keccak256(abi.encodePacked(address(this), sender, recipient, executor, amount, fee, nonce, expiryBlockNum));
        Validate.validateSignature(hash, sender, sig);

        _reserved[sender][nonce] = Reservation(amount, fee, recipient, executor, expiryBlockNum,
            ReservationStatus.Active);
        _totalReserved[sender] = _totalReserved[sender].add(total);

        return true;
    }

    function execute(address sender, uint256 nonce) public returns (bool success) {
        Reservation storage reservation = _reserved[sender][nonce];

        require(reservation._expiryBlockNum != 0, "Reservable: reservation does not exist");
        require(reservation._executor == _msgSender() || sender == _msgSender(),
            "Reservable: this address is not authorized to execute this reservation");
        require(reservation._expiryBlockNum > block.number,
            "Reservable: reservation has expired and cannot be executed");
        require(reservation._status == ReservationStatus.Active,
            "Reservable: invalid reservation status to execute");

        uint256 fee = reservation._fee;
        uint256 amount = reservation._amount;
        uint256 total = amount.add(fee);
        address recipient = reservation._recipient;
        address executor = reservation._executor;

        reservation._status = ReservationStatus.Completed;
        _totalReserved[sender] = _totalReserved[sender].sub(total);

        _transfer(sender, executor, fee);
        _transfer(sender, recipient, amount);

        return true;
    }

    function reclaim(address sender, uint256 nonce) public returns (bool success) {
        Reservation storage reservation = _reserved[sender][nonce];
        address executor = reservation._executor;

        require(reservation._expiryBlockNum != 0, "Reservable: reservation does not exist");
        require(reservation._status == ReservationStatus.Active,
            "Reservable: invalid reservation status to reclaim");
        if (_msgSender() != executor) {
            require(_msgSender() == sender,
                "Reservable: only the sender or the executor can reclaim the reservation back to the sender");
            require(reservation._expiryBlockNum <= block.number,
                "Reservable: reservation has not expired or you are not the executor and cannot be reclaimed");
        }

        reservation._status = ReservationStatus.Reclaimed;
        _totalReserved[sender] = _totalReserved[sender].sub(reservation._amount).sub(reservation._fee);

        return true;
    }

    function _unreservedBalance(address account) internal view returns (uint256 amount) {
        return BeforeTransferERC20.balanceOf(account).sub(_totalReserved[account]);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal {
        if (from != address(0)) {
            require(_unreservedBalance(from) >= amount, "Reservable: transfer amount exceeds unreserved balance");
        }

        super._beforeTokenTransfer(from, to, amount);
    }
    uint256[50] private __gap;
}
