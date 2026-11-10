// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice Read-only slice of Mezo's TroveManager (mezo-org/musd).
/// @dev Status enum there: 0 nonExistent, 1 active, 2 closedByOwner,
///      3 closedByLiquidation, 4 closedByRedemption.
interface ITroveManagerLike {
    function getTroveStatus(address borrower) external view returns (uint8);
}
