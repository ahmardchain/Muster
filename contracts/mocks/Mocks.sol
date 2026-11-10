// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockMUSD is ERC20 {
    constructor() ERC20("Mezo USD", "MUSD") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @dev Mirrors the real vault's shape: 1:1 shares, yield claimed separately,
///      and `withdraw` auto-claims yield to the caller.
contract MockSavings is ERC20 {
    IERC20 public immutable musdToken;
    IERC20 public immutable yieldTokenInternal;
    mapping(address => uint256) public pendingYieldOf;

    constructor(IERC20 _musd, IERC20 _yield) ERC20("MUSD Savings Rate", "sMUSD") {
        musdToken = _musd;
        yieldTokenInternal = _yield;
    }

    function yieldToken() external view returns (address) {
        return address(yieldTokenInternal);
    }

    function deposit(uint256 amount) external {
        musdToken.transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        _claim(msg.sender);
        _burn(msg.sender, amount);
        musdToken.transfer(msg.sender, amount);
    }

    function claimYield() external returns (uint256) {
        return _claim(msg.sender);
    }

    /// @dev Test helper: the yield tokens must already be in this contract.
    function accrue(address to, uint256 amount) external {
        pendingYieldOf[to] += amount;
    }

    function _claim(address who) internal returns (uint256 amount) {
        amount = pendingYieldOf[who];
        if (amount != 0) {
            pendingYieldOf[who] = 0;
            yieldTokenInternal.transfer(who, amount);
        }
    }
}

/// @dev A vault that short-changes deposits, to prove Muster refuses it.
contract ShortSavings is ERC20 {
    IERC20 public immutable musdToken;

    constructor(IERC20 _musd) ERC20("Bad", "BAD") {
        musdToken = _musd;
    }

    function yieldToken() external view returns (address) {
        return address(musdToken);
    }

    function deposit(uint256 amount) external {
        musdToken.transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount - 1);
    }

    function withdraw(uint256) external {}

    function claimYield() external pure returns (uint256) {
        return 0;
    }
}

contract MockTroveManager {
    mapping(address => uint8) public getTroveStatus;

    function set(address who, uint8 status) external {
        getTroveStatus[who] = status;
    }
}

contract MockCheck {
    mapping(address => bool) public done;
    bool public broken;

    function set(address who, bool v) external {
        done[who] = v;
    }

    function setBroken(bool v) external {
        broken = v;
    }

    function completed(address user) external view returns (bool) {
        require(!broken, "broken");
        return done[user];
    }
}

/// @dev Burns all gas when asked, to prove the gas cap holds.
contract GasHogCheck {
    function completed(address) external pure returns (bool) {
        while (true) {}
        return true;
    }
}
