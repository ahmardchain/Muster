// Demo mode: a pretend wallet and a pretend Mezo, run entirely in the browser.
// The quest rules mirror contracts/Muster.sol so judges see the real behaviour.
// Nothing here touches a chain.

export type Check = "loan" | "savings";

export type DemoQuest = {
  id: number;
  creator: "you" | "app";
  title: string;
  check: Check;
  threshold: number; // sMUSD the wallet must hold (savings quests)
  reward: number; // MUSD per wallet
  slots: number;
  slotsLeft: number;
  deadline: number; // demo day
  closed: boolean;
};

export type DemoState = {
  day: number; // demo clock, in days
  block: number; // advances on every action
  wallet: { musd: number; btc: number; savings: number; loan: null | { collateral: number; debt: number } };
  escrow: number; // MUSD Muster holds in Mezo savings for open quests
  quests: DemoQuest[];
  joined: Record<number, number>; // quest id -> block joined
  claimed: Record<number, boolean>;
  log: { block: number; text: string }[];
};

export const LOAN = { collateral: 0.03, borrow: 1800, gasDeposit: 200 }; // Mezo's minimum loan: 1,800 MUSD plus a 200 MUSD gas deposit
export const SAVE_AMOUNT = 50;

export function initialState(): DemoState {
  return {
    day: 0,
    block: 1,
    wallet: { musd: 1000, btc: 0.05, savings: 0, loan: null },
    escrow: 150 - 30 - 5, // the two app quests below, minus what earlier wallets were paid
    quests: [
      { id: 0, creator: "app", title: "Open your first MUSD loan on Mezo", check: "loan", threshold: 0, reward: 10, slots: 10, slotsLeft: 7, deadline: 14, closed: false },
      { id: 1, creator: "app", title: "Save 50 MUSD in Mezo savings", check: "savings", threshold: 50, reward: 5, slots: 10, slotsLeft: 9, deadline: 14, closed: false },
    ],
    joined: {},
    claimed: {},
    log: [{ block: 1, text: "Demo wallet created with 1,000 MUSD and 0.05 BTC." }],
  };
}

export type Result = { ok: true; state: DemoState; message: string } | { ok: false; error: string };

const fail = (error: string): Result => ({ ok: false, error });

function next(s: DemoState, text: string, change: (d: DemoState) => void): Result {
  const d: DemoState = structuredClone(s);
  change(d);
  d.block += 1;
  d.log = [{ block: d.block, text }, ...d.log].slice(0, 40);
  return { ok: true, state: d, message: text };
}

export function passes(s: DemoState, q: DemoQuest): boolean {
  return q.check === "loan" ? s.wallet.loan !== null : s.wallet.savings >= q.threshold;
}

export function isOpen(s: DemoState, q: DemoQuest): boolean {
  return !q.closed && s.day <= q.deadline && q.slotsLeft > 0;
}

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

// ---- Muster ----

export function postQuest(
  s: DemoState,
  p: { title: string; check: Check; threshold: number; reward: number; slots: number; days: number },
): Result {
  const title = p.title.trim();
  if (!title) return fail("Say what people must do.");
  if (new TextEncoder().encode(title).length > 80) return fail("Keep the action under 80 characters.");
  if (!(p.reward > 0)) return fail("Enter a reward above zero.");
  if (!Number.isInteger(p.slots) || p.slots < 1) return fail("Offer at least one place.");
  if (!Number.isInteger(p.days) || p.days < 1 || p.days > 90) return fail("Run the quest for 1 to 90 days.");
  if (p.check === "savings" && !(p.threshold > 0)) return fail("Enter the amount the wallet must hold.");
  const total = p.reward * p.slots;
  if (total > s.wallet.musd) return fail(`Your demo wallet holds ${fmt(s.wallet.musd)} MUSD, and this quest needs ${fmt(total)}.`);
  return next(s, `You posted “${title}”. ${fmt(total)} MUSD moved from your wallet into Mezo savings, held by Muster.`, (d) => {
    d.wallet.musd -= total;
    d.escrow += total;
    d.quests.unshift({
      id: d.quests.length ? Math.max(...d.quests.map((q) => q.id)) + 1 : 0,
      creator: "you",
      title,
      check: p.check,
      threshold: p.check === "savings" ? p.threshold : 0,
      reward: p.reward,
      slots: p.slots,
      slotsLeft: p.slots,
      deadline: d.day + p.days,
      closed: false,
    });
  });
}

export function join(s: DemoState, id: number): Result {
  const q = s.quests.find((x) => x.id === id);
  if (!q) return fail("There is no quest with this number.");
  if (!isOpen(s, q)) return fail("This quest is full or has ended.");
  if (s.joined[id] !== undefined) return fail("You already joined this quest.");
  if (passes(s, q)) return fail("Your wallet already meets the check, so it can't join. Rewards only go to actions taken after joining.");
  return next(s, `You joined “${q.title}”. Now do the action on Mezo.`, (d) => {
    d.joined[id] = d.block;
  });
}

export function claim(s: DemoState, id: number): Result {
  const q = s.quests.find((x) => x.id === id);
  if (!q) return fail("There is no quest with this number.");
  if (!isOpen(s, q)) return fail("This quest is full or has ended.");
  if (s.joined[id] === undefined) return fail("Join the quest first, then do the action.");
  if (s.block <= s.joined[id]) return fail("Wait for the next block, then claim again.");
  if (s.claimed[id]) return fail("You already claimed this reward.");
  if (!passes(s, q)) return fail("The check doesn't pass yet. Do the action with this wallet, then claim.");
  return next(s, `You claimed ${fmt(q.reward)} MUSD from “${q.title}”. Muster checked your wallet, took the reward out of Mezo savings and paid you.`, (d) => {
    const dq = d.quests.find((x) => x.id === id)!;
    dq.slotsLeft -= 1;
    d.escrow -= dq.reward;
    d.wallet.musd += dq.reward;
    d.claimed[id] = true;
  });
}

export function closeQuest(s: DemoState, id: number): Result {
  const q = s.quests.find((x) => x.id === id);
  if (!q) return fail("There is no quest with this number.");
  if (q.creator !== "you") return fail("Only the wallet that posted this quest can close it.");
  if (q.closed) return fail("This quest is already closed.");
  if (s.day <= q.deadline) return fail("You can take back unclaimed MUSD after the deadline.");
  const refund = q.reward * q.slotsLeft;
  return next(s, `You closed “${q.title}”. ${fmt(refund)} MUSD of unclaimed rewards came back to your wallet.`, (d) => {
    const dq = d.quests.find((x) => x.id === id)!;
    dq.closed = true; // slotsLeft is kept so the quest still shows how many places were paid
    d.escrow -= refund;
    d.wallet.musd += refund;
  });
}

// ---- Pretend Mezo ----

export function openLoan(s: DemoState): Result {
  if (s.wallet.loan) return fail("You already have a loan open.");
  if (s.wallet.btc < LOAN.collateral) return fail(`Opening a loan locks ${LOAN.collateral} BTC, and your demo wallet holds ${fmt(s.wallet.btc)}.`);
  return next(s, `On Mezo: you locked ${LOAN.collateral} BTC and borrowed ${fmt(LOAN.borrow)} MUSD.`, (d) => {
    d.wallet.btc = +(d.wallet.btc - LOAN.collateral).toFixed(8);
    d.wallet.musd += LOAN.borrow;
    d.wallet.loan = { collateral: LOAN.collateral, debt: LOAN.borrow + LOAN.gasDeposit };
  });
}

export function repayLoan(s: DemoState): Result {
  if (!s.wallet.loan) return fail("You have no loan to repay.");
  if (s.wallet.musd < LOAN.borrow) return fail(`Repaying needs ${fmt(LOAN.borrow)} MUSD, and your demo wallet holds ${fmt(s.wallet.musd)}.`);
  return next(s, `On Mezo: you repaid ${fmt(LOAN.borrow)} MUSD and got your ${LOAN.collateral} BTC back.`, (d) => {
    d.wallet.musd -= LOAN.borrow;
    d.wallet.btc = +(d.wallet.btc + LOAN.collateral).toFixed(8);
    d.wallet.loan = null;
  });
}

export function save(s: DemoState): Result {
  if (s.wallet.musd < SAVE_AMOUNT) return fail(`Saving needs ${SAVE_AMOUNT} MUSD, and your demo wallet holds ${fmt(s.wallet.musd)}.`);
  return next(s, `On Mezo: you saved ${SAVE_AMOUNT} MUSD and received ${SAVE_AMOUNT} sMUSD.`, (d) => {
    d.wallet.musd -= SAVE_AMOUNT;
    d.wallet.savings += SAVE_AMOUNT;
  });
}

export function withdrawSavings(s: DemoState): Result {
  if (s.wallet.savings < SAVE_AMOUNT) return fail(`You have ${fmt(s.wallet.savings)} sMUSD saved.`);
  return next(s, `On Mezo: you withdrew ${SAVE_AMOUNT} MUSD from savings.`, (d) => {
    d.wallet.savings -= SAVE_AMOUNT;
    d.wallet.musd += SAVE_AMOUNT;
  });
}

export function skipWeek(s: DemoState): Result {
  return next(s, "A week passed.", (d) => {
    d.day += 7;
  });
}
