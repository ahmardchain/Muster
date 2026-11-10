import { parseAbi, type Address } from "viem";

const env = (v: string | undefined, fallback: string) => (v && v.length > 0 ? v : fallback) as Address;

export const LOCAL_RPC = process.env.NEXT_PUBLIC_LOCAL_RPC || "";
export const CHAIN_ID = LOCAL_RPC ? 31337 : 31611;
export const EXPLORER = "https://explorer.test.mezo.org";

// Mezo testnet (chain 31611). MUSD and TroveManager come from mezo-org/musd;
// sMUSD is the MUSD Savings Rate vault verified on the testnet explorer.
export const ADDR = {
  muster: env(process.env.NEXT_PUBLIC_MUSTER_ADDRESS, ""),
  musd: env(process.env.NEXT_PUBLIC_MUSD_ADDRESS, "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503"),
  smusd: env(process.env.NEXT_PUBLIC_SMUSD_ADDRESS, "0x6f461c68B2c5492C0F5CCEc5a264d692aA7A8e16"),
};

export const DEPLOYED = ADDR.muster.length === 42;

export const musterAbi = parseAbi([
  "struct Quest { address creator; uint8 check; address target; uint256 threshold; uint256 reward; uint32 slots; uint32 slotsLeft; uint64 deadline; bool closed; string title; string url; }",
  "function questCount() view returns (uint256)",
  "function getQuest(uint256 id) view returns (Quest)",
  "function completed(uint256 id, address user) view returns (bool)",
  "function joinedAt(uint256 id, address user) view returns (uint256)",
  "function claimed(uint256 id, address user) view returns (bool)",
  "function escrowed() view returns (uint256)",
  "function createQuest(uint8 check, address target, uint256 threshold, uint256 reward, uint32 slots, uint64 deadline, string title, string url) returns (uint256)",
  "function join(uint256 id)",
  "function claim(uint256 id)",
  "function closeQuest(uint256 id)",
  "error BadParams()",
  "error NoSuchQuest()",
  "error QuestOver()",
  "error QuestStillOpen()",
  "error AlreadyJoined()",
  "error AlreadyQualifies()",
  "error NotJoined()",
  "error TooSoon()",
  "error AlreadyClaimed()",
  "error NotCompleted()",
  "error NotCreator()",
  "error SavingsMismatch()",
]);

export const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function symbol() view returns (string)",
]);

export type Quest = {
  creator: Address;
  check: number;
  target: Address;
  threshold: bigint;
  reward: bigint;
  slots: number;
  slotsLeft: number;
  deadline: bigint;
  closed: boolean;
  title: string;
  url: string;
};

export const CHECK = { TroveActive: 0, BalanceAtLeast: 1, Custom: 2 } as const;
