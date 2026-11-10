"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { ADDR, CHAIN_ID, DEPLOYED, musterAbi, type Quest } from "./contracts";

const base = { address: ADDR.muster, abi: musterAbi, chainId: CHAIN_ID } as const;

/** Every quest, newest first. Works without a connected wallet. */
export function useQuests() {
  const count = useReadContract({ ...base, functionName: "questCount", query: { enabled: DEPLOYED, refetchInterval: 15_000 } });
  const n = Number(count.data ?? 0n);
  const list = useReadContracts({
    allowFailure: false,
    contracts: Array.from({ length: n }, (_, i) => ({ ...base, functionName: "getQuest" as const, args: [BigInt(i)] as const })),
    query: { enabled: DEPLOYED && n > 0, refetchInterval: 15_000 },
  });
  const quests = ((list.data ?? []) as unknown as Quest[]).map((q, id) => ({ id, q })).reverse();
  return {
    quests,
    isLoading: count.isLoading || (n > 0 && list.isLoading),
    error: count.error || list.error,
  };
}

export function useQuest(id: number) {
  const r = useReadContract({ ...base, functionName: "getQuest", args: [BigInt(id)], query: { enabled: DEPLOYED, refetchInterval: 10_000 } });
  return { quest: r.data as unknown as Quest | undefined, isLoading: r.isLoading, error: r.error, refetch: r.refetch };
}
