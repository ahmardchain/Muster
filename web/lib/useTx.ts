"use client";

import { useCallback, useState } from "react";
import { useConfig } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { CHAIN_ID } from "./contracts";
import { explainError } from "./format";

type Status = { busy: string | null; error: string | null; done: string | null };

/**
 * Send one contract write and wait for it to be mined.
 * `busy` names the action in progress so buttons can say what is happening.
 */
export function useTx() {
  const config = useConfig();
  const [status, setStatus] = useState<Status>({ busy: null, error: null, done: null });

  const send = useCallback(
    async (label: string, request: Parameters<typeof writeContract>[1], doneText?: string): Promise<boolean> => {
      setStatus({ busy: label, error: null, done: null });
      try {
        const hash = await writeContract(config, { ...request, chainId: CHAIN_ID } as Parameters<typeof writeContract>[1]);
        const receipt = await waitForTransactionReceipt(config, { hash, chainId: CHAIN_ID });
        if (receipt.status !== "success") throw new Error("The transaction was mined but failed.");
        setStatus({ busy: null, error: null, done: doneText ?? null });
        return true;
      } catch (e) {
        setStatus({ busy: null, error: explainError(e), done: null });
        return false;
      }
    },
    [config],
  );

  return { ...status, send };
}
