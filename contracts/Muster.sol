// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IMUSDSavingsRate} from "./interfaces/IMUSDSavingsRate.sol";
import {ITroveManagerLike} from "./interfaces/ITroveManagerLike.sol";
import {IMusterCheck} from "./interfaces/IMusterCheck.sol";

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
        uint32 slotsLeft;
        uint64 deadline;
        bool closed;
    }

    uint256 public constant MAX_DURATION = 90 days;
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
        uint64 deadline
    ) external nonReentrant returns (uint256 id) {
        if (reward == 0 || slots == 0) revert BadParams();
        if (deadline <= block.timestamp || deadline > block.timestamp + MAX_DURATION) revert BadParams();
        if (check != Check.TroveActive && target.code.length == 0) revert BadParams();
        if (check == Check.BalanceAtLeast && threshold == 0) revert BadParams();

        uint256 total = reward * slots;
        id = _quests.length;
        _quests.push(
            Quest({
                creator: msg.sender,
                check: check,
                target: target,
                threshold: threshold,
                reward: reward,
                slotsLeft: slots,
                deadline: deadline,
                closed: false
            })
        );
        escrowed += total;

        musd.safeTransferFrom(msg.sender, address(this), total);
        uint256 before = savings.balanceOf(address(this));
        musd.forceApprove(address(savings), total);
        savings.deposit(total);
        if (savings.balanceOf(address(this)) - before != total) revert SavingsMismatch();

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
