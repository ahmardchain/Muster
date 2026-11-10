// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice The parts of Mezo's MUSD Savings Rate vault (sMUSD) that Muster uses.
/// @dev Taken from the verified MUSDSavingsRate source on the Mezo testnet
///      explorer (proxy 0x6f461c68B2c5492C0F5CCEc5a264d692aA7A8e16). It is NOT
///      ERC-4626: shares are 1:1 with deposited MUSD and yield is claimed
///      separately in `yieldToken`.
interface IMUSDSavingsRate {
    function deposit(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function claimYield() external returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function yieldToken() external view returns (address);

    function musdToken() external view returns (address);
}
