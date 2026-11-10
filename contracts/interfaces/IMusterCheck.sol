// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice Any Mezo app can plug its own "did this wallet use us?" rule into
///         Muster by deploying a contract with this one view function.
interface IMusterCheck {
    function completed(address user) external view returns (bool);
}
