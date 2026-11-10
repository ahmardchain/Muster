// Sources flattened with hardhat v2.22.17 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol@v5.0.2

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/IERC20Permit.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in
 * https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].
 *
 * Adds the {permit} method, which can be used to change an account's ERC20 allowance (see {IERC20-allowance}) by
 * presenting a message signed by the account. By not relying on {IERC20-approve}, the token holder account doesn't
 * need to send a transaction, and thus is not required to hold Ether at all.
 *
 * ==== Security Considerations
 *
 * There are two important considerations concerning the use of `permit`. The first is that a valid permit signature
 * expresses an allowance, and it should not be assumed to convey additional meaning. In particular, it should not be
 * considered as an intention to spend the allowance in any specific way. The second is that because permits have
 * built-in replay protection and can be submitted by anyone, they can be frontrun. A protocol that uses permits should
 * take this into consideration and allow a `permit` call to fail. Combining these two aspects, a pattern that may be
 * generally recommended is:
 *
 * ```solidity
 * function doThingWithPermit(..., uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public {
 *     try token.permit(msg.sender, address(this), value, deadline, v, r, s) {} catch {}
 *     doThing(..., value);
 * }
 *
 * function doThing(..., uint256 value) public {
 *     token.safeTransferFrom(msg.sender, address(this), value);
 *     ...
 * }
 * ```
 *
 * Observe that: 1) `msg.sender` is used as the owner, leaving no ambiguity as to the signer intent, and 2) the use of
 * `try/catch` allows the permit to fail and makes the code tolerant to frontrunning. (See also
 * {SafeERC20-safeTransferFrom}).
 *
 * Additionally, note that smart contract wallets (such as Argent or Safe) are not able to produce permit signatures, so
 * contracts should have entry points that don't rely on permit.
 */
interface IERC20Permit {
    /**
     * @dev Sets `value` as the allowance of `spender` over ``owner``'s tokens,
     * given ``owner``'s signed approval.
     *
     * IMPORTANT: The same issues {IERC20-approve} has related to transaction
     * ordering also apply here.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `deadline` must be a timestamp in the future.
     * - `v`, `r` and `s` must be a valid `secp256k1` signature from `owner`
     * over the EIP712-formatted function arguments.
     * - the signature must use ``owner``'s current nonce (see {nonces}).
     *
     * For more information on the signature format, see the
     * https://eips.ethereum.org/EIPS/eip-2612#specification[relevant EIP
     * section].
     *
     * CAUTION: See Security Considerations above.
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @dev Returns the current nonce for `owner`. This value must be
     * included whenever a signature is generated for {permit}.
     *
     * Every successful call to {permit} increases ``owner``'s nonce by one. This
     * prevents a signature from being used multiple times.
     */
    function nonces(address owner) external view returns (uint256);

    /**
     * @dev Returns the domain separator used in the encoding of the signature for {permit}, as defined by {EIP712}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.0.2

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/utils/Address.sol@v5.0.2

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/Address.sol)

pragma solidity ^0.8.20;

/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev The ETH balance of the account is not enough to perform the operation.
     */
    error AddressInsufficientBalance(address account);

    /**
     * @dev There's no code at `target` (it is not a contract).
     */
    error AddressEmptyCode(address target);

    /**
     * @dev A call to an address target failed. The target may have reverted.
     */
    error FailedInnerCall();

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.8.20/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        if (address(this).balance < amount) {
            revert AddressInsufficientBalance(address(this));
        }

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            revert FailedInnerCall();
        }
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason or custom error, it is bubbled
     * up by this function (like regular Solidity function calls). However, if
     * the call reverted with no returned reason, this function reverts with a
     * {FailedInnerCall} error.
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     */
    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        if (address(this).balance < value) {
            revert AddressInsufficientBalance(address(this));
        }
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    /**
     * @dev Tool to verify that a low level call to smart-contract was successful, and reverts if the target
     * was not a contract or bubbling up the revert reason (falling back to {FailedInnerCall}) in case of an
     * unsuccessful call.
     */
    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata
    ) internal view returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            // only check if target is a contract if the call was successful and the return data is empty
            // otherwise we already know that it was a contract
            if (returndata.length == 0 && target.code.length == 0) {
                revert AddressEmptyCode(target);
            }
            return returndata;
        }
    }

    /**
     * @dev Tool to verify that a low level call was successful, and reverts if it wasn't, either by bubbling the
     * revert reason or with a default {FailedInnerCall} error.
     */
    function verifyCallResult(bool success, bytes memory returndata) internal pure returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            return returndata;
        }
    }

    /**
     * @dev Reverts with returndata if present. Otherwise reverts with {FailedInnerCall}.
     */
    function _revert(bytes memory returndata) private pure {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            /// @solidity memory-safe-assembly
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert FailedInnerCall();
        }
    }
}


// File @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol@v5.0.2

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/utils/SafeERC20.sol)

pragma solidity ^0.8.20;



/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    using Address for address;

    /**
     * @dev An operation with an ERC20 token failed.
     */
    error SafeERC20FailedOperation(address token);

    /**
     * @dev Indicates a failed `decreaseAllowance` request.
     */
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    /**
     * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transfer, (to, value)));
    }

    /**
     * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
     * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
     */
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

    /**
     * @dev Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    /**
     * @dev Decrease the calling contract's allowance toward `spender` by `requestedDecrease`. If `token` returns no
     * value, non-reverting calls are assumed to be successful.
     */
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    /**
     * @dev Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful. Meant to be used with tokens that require the approval
     * to be set to zero before setting it to a non-zero value, such as USDT.
     */
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        bytes memory approvalCall = abi.encodeCall(token.approve, (spender, value));

        if (!_callOptionalReturnBool(token, approvalCall)) {
            _callOptionalReturn(token, abi.encodeCall(token.approve, (spender, 0)));
            _callOptionalReturn(token, approvalCall);
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We use {Address-functionCall} to perform this call, which verifies that
        // the target address contains contract code and also asserts for success in the low-level call.

        bytes memory returndata = address(token).functionCall(data);
        if (returndata.length != 0 && !abi.decode(returndata, (bool))) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturn} that silents catches all reverts and returns a bool instead.
     */
    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We cannot use {Address-functionCall} here since this should return false
        // and not revert is the subcall reverts.

        (bool success, bytes memory returndata) = address(token).call(data);
        return success && (returndata.length == 0 || abi.decode(returndata, (bool))) && address(token).code.length > 0;
    }
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.0.2

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// File contracts/interfaces/IMUSDSavingsRate.sol

// Original license: SPDX_License_Identifier: MIT
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


// File contracts/interfaces/IMusterCheck.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity 0.8.28;

/// @notice Any Mezo app can plug its own "did this wallet use us?" rule into
///         Muster by deploying a contract with this one view function.
interface IMusterCheck {
    function completed(address user) external view returns (bool);
}


// File contracts/interfaces/ITroveManagerLike.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity 0.8.28;

/// @notice Read-only slice of Mezo's TroveManager (mezo-org/musd).
/// @dev Status enum there: 0 nonExistent, 1 active, 2 closedByOwner,
///      3 closedByLiquidation, 4 closedByRedemption.
interface ITroveManagerLike {
    function getTroveStatus(address borrower) external view returns (uint8);
}


// File contracts/Muster.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity 0.8.28;






/// @title Muster
/// @notice Quests that pay MUSD to wallets that provably used a Mezo app.
///
///         A creator escrows MUSD for a quest. While the quest is open the
///         escrow sits in Mezo's MUSD Savings Rate vault (sMUSD). A user joins
///         a quest *before* doing the action, does it, and then claims. The
///         contract checks the action on-chain; nobody reviews screenshots.
///
///         No owner, no upgrade, no pause. Yield earned by idle escrow is the
///         protocol's only revenue and is the only thing `sweep` can move.
contract Muster is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev How a quest decides that a wallet did the action.
    enum Check {
        TroveActive, // wallet has an active MUSD trove on Mezo
        BalanceAtLeast, // wallet holds >= threshold of `target` (ERC-20 or ERC-721)
        Custom // `target` implements IMusterCheck
    }

    struct Quest {
        address creator;
        Check check;
        address target;
        uint256 threshold;
        uint256 reward; // MUSD paid per claim
        uint32 slots; // how many wallets can be paid in total
        uint32 slotsLeft;
        uint64 deadline;
        bool closed;
        string title; // what the user must do, in plain words
        string url; // where to do it
    }

    uint256 public constant MAX_DURATION = 90 days;
    uint256 public constant MAX_TITLE = 80;
    uint256 public constant MAX_URL = 200;
    uint256 private constant CHECK_GAS = 200_000;
    uint8 private constant TROVE_ACTIVE = 1;

    IERC20 public immutable musd;
    IMUSDSavingsRate public immutable savings;
    ITroveManagerLike public immutable troveManager;
    address public immutable treasury;

    /// @notice MUSD owed to open quests. Always equals this contract's sMUSD
    ///         principal; the invariant every test asserts.
    uint256 public escrowed;

    Quest[] private _quests;
    /// @notice Block in which a wallet joined a quest (0 = not joined).
    mapping(uint256 => mapping(address => uint256)) public joinedAt;
    mapping(uint256 => mapping(address => bool)) public claimed;

    event QuestCreated(
        uint256 indexed id,
        address indexed creator,
        Check check,
        address target,
        uint256 threshold,
        uint256 reward,
        uint32 slots,
        uint64 deadline
    );
    event Joined(uint256 indexed id, address indexed user);
    event Claimed(uint256 indexed id, address indexed user, uint256 reward);
    event QuestClosed(uint256 indexed id, uint256 refunded);
    event Swept(address indexed token, uint256 amount);

    error ZeroAddress();
    error BadParams();
    error NoSuchQuest();
    error QuestOver();
    error QuestStillOpen();
    error AlreadyJoined();
    error AlreadyQualifies();
    error NotJoined();
    error TooSoon();
    error AlreadyClaimed();
    error NotCompleted();
    error NotCreator();
    error SavingsMismatch();

    constructor(
        IERC20 _musd,
        IMUSDSavingsRate _savings,
        ITroveManagerLike _troveManager,
        address _treasury
    ) {
        if (
            address(_musd) == address(0) ||
            address(_savings) == address(0) ||
            address(_troveManager) == address(0) ||
            _treasury == address(0)
        ) revert ZeroAddress();
        musd = _musd;
        savings = _savings;
        troveManager = _troveManager;
        treasury = _treasury;
    }

    // ------------------------------------------------------------------
    // Creator
    // ------------------------------------------------------------------

    /// @notice Open a quest and escrow `reward * slots` MUSD into sMUSD.
    /// @dev Caller must approve this contract for the MUSD first.
    function createQuest(
        Check check,
        address target,
        uint256 threshold,
        uint256 reward,
        uint32 slots,
        uint64 deadline,
        string calldata title,
        string calldata url
    ) external nonReentrant returns (uint256 id) {
        if (reward == 0 || slots == 0) revert BadParams();
        if (bytes(title).length == 0 || bytes(title).length > MAX_TITLE || bytes(url).length > MAX_URL) {
            revert BadParams();
        }
        if (deadline <= block.timestamp || deadline > block.timestamp + MAX_DURATION) revert BadParams();
        if (check != Check.TroveActive && target.code.length == 0) revert BadParams();
        if (check == Check.BalanceAtLeast && threshold == 0) revert BadParams();

        id = _quests.length;
        _quests.push(
            Quest({
                creator: msg.sender,
                check: check,
                target: target,
                threshold: threshold,
                reward: reward,
                slots: slots,
                slotsLeft: slots,
                deadline: deadline,
                closed: false,
                title: title,
                url: url
            })
        );
        _fund(reward * slots);

        emit QuestCreated(id, msg.sender, check, target, threshold, reward, slots, deadline);
    }

    /// @notice After the deadline, return unclaimed escrow to the creator.
    /// @dev Creators cannot cancel early: wallets that joined are owed the
    ///      chance to finish until the deadline they were shown.
    function closeQuest(uint256 id) external nonReentrant {
        Quest storage q = _quest(id);
        if (msg.sender != q.creator) revert NotCreator();
        if (q.closed) revert QuestOver();
        if (block.timestamp <= q.deadline) revert QuestStillOpen();

        uint256 refund = q.reward * q.slotsLeft;
        q.closed = true;
        q.slotsLeft = 0;
        escrowed -= refund;

        if (refund != 0) {
            savings.withdraw(refund);
            musd.safeTransfer(q.creator, refund);
        }
        emit QuestClosed(id, refund);
    }

    // ------------------------------------------------------------------
    // User
    // ------------------------------------------------------------------

    /// @notice Join a quest. Reverts if the wallet already satisfies the
    ///         check, so a reward can only go to an action taken after joining.
    function join(uint256 id) external {
        Quest storage q = _quest(id);
        if (q.closed || block.timestamp > q.deadline || q.slotsLeft == 0) revert QuestOver();
        if (joinedAt[id][msg.sender] != 0) revert AlreadyJoined();
        if (_completed(q, msg.sender)) revert AlreadyQualifies();

        joinedAt[id][msg.sender] = block.number;
        emit Joined(id, msg.sender);
    }

    /// @notice Claim the reward once the action is visible on-chain.
    function claim(uint256 id) external nonReentrant {
        Quest storage q = _quest(id);
        if (q.closed || block.timestamp > q.deadline || q.slotsLeft == 0) revert QuestOver();
        uint256 joined = joinedAt[id][msg.sender];
        if (joined == 0) revert NotJoined();
        if (block.number <= joined) revert TooSoon();
        if (claimed[id][msg.sender]) revert AlreadyClaimed();
        if (!_completed(q, msg.sender)) revert NotCompleted();

        uint256 reward = q.reward;
        claimed[id][msg.sender] = true;
        q.slotsLeft -= 1;
        escrowed -= reward;

        savings.withdraw(reward);
        musd.safeTransfer(msg.sender, reward);
        emit Claimed(id, msg.sender, reward);
    }

    // ------------------------------------------------------------------
    // Revenue
    // ------------------------------------------------------------------

    /// @notice Pull savings yield and send everything that is not escrow to
    ///         the treasury. Callable by anyone.
    /// @dev Escrow principal only ever exists as sMUSD, so for any other
    ///      token the whole balance is yield (or a stray transfer). For sMUSD
    ///      itself only the excess above `escrowed` can leave.
    function sweep(IERC20 token) external nonReentrant returns (uint256 amount) {
        if (savings.balanceOf(address(this)) != 0) savings.claimYield();

        amount = token.balanceOf(address(this));
        if (address(token) == address(savings)) {
            amount = amount > escrowed ? amount - escrowed : 0;
        }
        if (amount != 0) token.safeTransfer(treasury, amount);
        emit Swept(address(token), amount);
    }

    // ------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------

    function questCount() external view returns (uint256) {
        return _quests.length;
    }

    function getQuest(uint256 id) external view returns (Quest memory) {
        return _quest(id);
    }

    /// @notice Does `user` currently satisfy quest `id`'s check?
    function completed(uint256 id, address user) external view returns (bool) {
        return _completed(_quest(id), user);
    }

    // ------------------------------------------------------------------
    // Internal
    // ------------------------------------------------------------------

    /// @dev Pull MUSD from the caller and park all of it in the savings vault.
    function _fund(uint256 total) private {
        escrowed += total;
        musd.safeTransferFrom(msg.sender, address(this), total);
        uint256 before = savings.balanceOf(address(this));
        musd.forceApprove(address(savings), total);
        savings.deposit(total);
        if (savings.balanceOf(address(this)) - before != total) revert SavingsMismatch();
    }

    function _quest(uint256 id) private view returns (Quest storage) {
        if (id >= _quests.length) revert NoSuchQuest();
        return _quests[id];
    }

    /// @dev External reads are gas-capped and wrapped: a broken or hostile
    ///      target can only make its own quest unclaimable, never revert
    ///      someone else's call path or burn unbounded gas.
    function _completed(Quest storage q, address user) private view returns (bool) {
        if (q.check == Check.TroveActive) {
            try troveManager.getTroveStatus{gas: CHECK_GAS}(user) returns (uint8 status) {
                return status == TROVE_ACTIVE;
            } catch {
                return false;
            }
        }
        if (q.check == Check.BalanceAtLeast) {
            try IERC20(q.target).balanceOf{gas: CHECK_GAS}(user) returns (uint256 bal) {
                return bal >= q.threshold;
            } catch {
                return false;
            }
        }
        try IMusterCheck(q.target).completed{gas: CHECK_GAS}(user) returns (bool ok) {
            return ok;
        } catch {
            return false;
        }
    }
}
