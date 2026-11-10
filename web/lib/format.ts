import { formatUnits, type Address } from "viem";
import { ADDR, CHECK, type Quest } from "./contracts";

export function musd(amount: bigint): string {
  const n = Number(formatUnits(amount, 18));
  return n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 2 : 0 });
}

export function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function timeLeft(deadline: bigint, now = Date.now()): string {
  const s = Number(deadline) - Math.floor(now / 1000);
  if (s <= 0) return "Ended";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d >= 1) return `${d} day${d === 1 ? "" : "s"} left`;
  if (h >= 1) return `${h} hour${h === 1 ? "" : "s"} left`;
  return `${Math.max(1, Math.floor(s / 60))} min left`;
}

export type QuestState = "open" | "full" | "ended";

export function questState(q: Quest, now = Date.now()): QuestState {
  if (q.closed || Number(q.deadline) * 1000 < now) return "ended";
  if (q.slotsLeft === 0) return "full";
  return "open";
}

/** How the contract decides a wallet did it, in plain words. */
export function checkText(q: Quest, symbol?: string): string {
  if (q.check === CHECK.TroveActive) return "Your wallet has an open MUSD loan on Mezo";
  if (q.check === CHECK.BalanceAtLeast) {
    const isSavings = q.target.toLowerCase() === ADDR.smusd.toLowerCase();
    const name = isSavings ? "sMUSD (Mezo savings)" : symbol || `token ${shortAddr(q.target)}`;
    return `Your wallet holds at least ${musd(q.threshold)} ${name}`;
  }
  return `The app's own rule at ${shortAddr(q.target)} says your wallet is done`;
}

const ERRORS: Record<string, string> = {
  AlreadyQualifies: "This wallet already meets the check, so it can't join. Rewards only go to actions taken after joining.",
  AlreadyJoined: "This wallet already joined.",
  NotJoined: "Join the quest first, then do the action.",
  TooSoon: "Wait for the next block, then claim again.",
  AlreadyClaimed: "This wallet already claimed this reward.",
  NotCompleted: "The check doesn't pass yet. Finish the action with this same wallet, then claim.",
  QuestOver: "This quest is full or has ended.",
  QuestStillOpen: "You can take back unclaimed MUSD after the deadline.",
  NotCreator: "Only the wallet that posted this quest can close it.",
  BadParams: "Some details aren't valid. Check the reward, slots, deadline and addresses.",
  SavingsMismatch: "The savings vault didn't credit the deposit. Nothing was posted.",
};

export function explainError(e: unknown): string {
  const text = e instanceof Error ? e.message : String(e);
  for (const name of Object.keys(ERRORS)) if (text.includes(name)) return ERRORS[name];
  if (/user rejected|denied/i.test(text)) return "You cancelled the request in your wallet.";
  if (/insufficient funds/i.test(text)) return "This wallet doesn't have enough BTC to pay the network fee.";
  if (/transfer amount exceeds balance|ERC20InsufficientBalance/i.test(text)) return "This wallet doesn't hold enough MUSD.";
  const first = text.split("\n")[0];
  return first.length > 160 ? `${first.slice(0, 160)}…` : first;
}

export function isAddress(v: string): v is Address {
  return /^0x[0-9a-fA-F]{40}$/.test(v);
}
