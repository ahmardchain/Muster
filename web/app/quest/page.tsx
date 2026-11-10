"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import Roll from "@/components/Roll";
import { ADDR, CHAIN_ID, CHECK, DEPLOYED, EXPLORER, erc20Abi, musterAbi } from "@/lib/contracts";
import { checkText, musd, questState, shortAddr, timeLeft } from "@/lib/format";
import { useQuest } from "@/lib/useQuests";
import { useTx } from "@/lib/useTx";

const base = { address: ADDR.muster, abi: musterAbi, chainId: CHAIN_ID } as const;

// The quest number comes from the address (?id=3) so the whole site can be
// served as static files.
export default function QuestPage() {
  return (
    <Suspense fallback={<p className="mt-12 text-ink-soft">Reading the quest from Mezo…</p>}>
      <QuestView />
    </Suspense>
  );
}

function QuestView() {
  const raw = useSearchParams().get("id") ?? "";
  const valid = /^\d+$/.test(raw);
  const id = valid ? Number(raw) : 0;
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { quest: q, isLoading, error, refetch } = useQuest(id);
  const tx = useTx();

  const mine = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...base, functionName: "joinedAt", args: [BigInt(id), address ?? ADDR.muster] },
      { ...base, functionName: "claimed", args: [BigInt(id), address ?? ADDR.muster] },
      { ...base, functionName: "completed", args: [BigInt(id), address ?? ADDR.muster] },
    ],
    query: { enabled: DEPLOYED && valid && !!address && !!q, refetchInterval: 8_000 },
  });
  const symbol = useReadContract({
    address: q?.target,
    abi: erc20Abi,
    chainId: CHAIN_ID,
    functionName: "symbol",
    query: { enabled: !!q && q.check === CHECK.BalanceAtLeast },
  });

  if (!DEPLOYED) return <p className="notice mt-12 max-w-prose">The Muster contract isn&rsquo;t connected yet.</p>;
  if (!valid || (error && !q)) {
    return (
      <div className="mt-12 max-w-prose">
        <p className="notice">There is no quest with this number.</p>
        <Link href="/#quests" className="btn-quiet mt-4">
          See all quests
        </Link>
      </div>
    );
  }
  if (isLoading || !q) return <p className="mt-12 text-ink-soft">Reading the quest from Mezo…</p>;

  const state = questState(q);
  const joined = !!address && !!mine.data && (mine.data[0] as bigint) > 0n;
  const claimed = !!address && !!mine.data && (mine.data[1] as boolean);
  const passes = !!address && !!mine.data && (mine.data[2] as boolean);
  const isCreator = !!address && address.toLowerCase() === q.creator.toLowerCase();
  const deadlinePassed = Number(q.deadline) * 1000 < Date.now();
  const refundable = q.reward * BigInt(q.slotsLeft);
  const after = async () => {
    await Promise.all([refetch(), mine.refetch()]);
  };

  // Which of the three steps the connected wallet is on.
  const step = claimed ? 3 : joined ? (passes ? 2 : 1) : 0;

  return (
    <article className="pt-10">
      <Link href="/#quests" className="text-[15px] font-medium underline underline-offset-4">
        All quests
      </Link>

      <header className="mt-6 grid gap-8 border-b border-ink pb-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
        <div>
          <h1 className="font-display text-[clamp(2.4rem,6.5vw,4.5rem)] font-black leading-[0.95] tracking-tight">{q.title}</h1>
          <p className="mt-4 text-lg text-ink-soft">
            {state === "open" ? timeLeft(q.deadline) : state === "full" ? "All places are paid" : "This quest has ended"}. Posted by{" "}
            <a className="underline underline-offset-2" href={`${EXPLORER}/address/${q.creator}`} target="_blank" rel="noreferrer">
              {shortAddr(q.creator)}
            </a>
            .
          </p>
        </div>
        <div className="self-end">
          <p className="font-display text-6xl font-black leading-none">
            {musd(q.reward)} <span className="text-3xl font-bold">MUSD</span>
          </p>
          <p className="mb-4 mt-1 text-[15px] text-ink-soft">paid to each wallet that completes it</p>
          <Roll slots={q.slots} slotsLeft={q.slotsLeft} size="lg" />
        </div>
      </header>

      <div className="grid gap-12 pt-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
        <section aria-labelledby="steps">
          <h2 id="steps" className="font-display text-3xl font-black leading-none">
            How to earn it
          </h2>
          <ol className="mt-5 border-t-2 border-ink">
            <Step n={1} title="Join the quest" done={step >= 1} current={step === 0 && state === "open"}>
              <p>Join first. Rewards only go to wallets that did the action after joining.</p>
              {state === "open" && step === 0 && (
                <button
                  className="btn mt-3"
                  disabled={!!tx.busy}
                  onClick={() => {
                    if (!address) return openConnectModal?.();
                    tx.send("join", { ...base, functionName: "join", args: [BigInt(id)] }, "Joined. Now do the action.").then(after);
                  }}
                >
                  {tx.busy === "join" ? "Joining…" : address ? "Join quest" : "Connect wallet to join"}
                </button>
              )}
            </Step>
            <Step n={2} title="Do the action" done={step >= 2} current={step === 1}>
              <p>{checkText(q, symbol.data as string | undefined)}.</p>
              {q.url && (
                <a className={`${step === 1 ? "btn" : "btn-quiet"} mt-3`} href={q.url} target="_blank" rel="noreferrer">
                  Open the app
                </a>
              )}
              {step === 1 && <p className="hint">This page checks your wallet every few seconds.</p>}
            </Step>
            <Step n={3} title="Claim your MUSD" done={step >= 3} current={step === 2 && state === "open"}>
              {claimed ? (
                <p>Paid. {musd(q.reward)} MUSD was sent to your wallet.</p>
              ) : (
                <p>When the check passes, claim and the contract sends {musd(q.reward)} MUSD to your wallet.</p>
              )}
              {joined && !claimed && state === "open" && (
                <button
                  className="btn mt-3"
                  disabled={!passes || !!tx.busy}
                  onClick={() =>
                    tx.send("claim", { ...base, functionName: "claim", args: [BigInt(id)] }, `Claimed ${musd(q.reward)} MUSD.`).then(after)
                  }
                >
                  {tx.busy === "claim" ? "Claiming…" : passes ? `Claim ${musd(q.reward)} MUSD` : "Check not passed yet"}
                </button>
              )}
            </Step>
          </ol>
          <div aria-live="polite" className="mt-5 space-y-3">
            {tx.error && <p className="notice">{tx.error}</p>}
            {tx.done && <p className="border-l-4 border-ink bg-raised px-4 py-3 text-[15px] font-medium">{tx.done}</p>}
            {state !== "open" && !claimed && joined && (
              <p className="notice">This quest {state === "full" ? "filled up" : "ended"} before your claim, so it can no longer pay.</p>
            )}
          </div>
        </section>

        <aside aria-labelledby="facts">
          <h2 id="facts" className="font-display text-3xl font-black leading-none">
            The fine print
          </h2>
          <dl className="mt-5 border-t-2 border-ink text-[15px]">
            <Fact term="How it is checked">{checkText(q, symbol.data as string | undefined)}</Fact>
            <Fact term="Where the reward sits">
              In Mezo&rsquo;s MUSD savings vault, held by the Muster contract. The poster cannot take it back before the deadline.
            </Fact>
            <Fact term="Deadline">{new Date(Number(q.deadline) * 1000).toLocaleString()}</Fact>
            <Fact term="Still to pay">
              {musd(refundable)} MUSD across {q.slotsLeft} place{q.slotsLeft === 1 ? "" : "s"}
            </Fact>
          </dl>
          {isCreator && !q.closed && (
            <div className="mt-6">
              <button
                className="btn-quiet"
                disabled={!deadlinePassed || !!tx.busy}
                onClick={() =>
                  tx
                    .send("close", { ...base, functionName: "closeQuest", args: [BigInt(id)] }, `Quest closed. ${musd(refundable)} MUSD returned.`)
                    .then(after)
                }
              >
                {tx.busy === "close" ? "Closing…" : `Close quest and take back ${musd(refundable)} MUSD`}
              </button>
              {!deadlinePassed && <p className="hint">You posted this quest. You can close it after the deadline.</p>}
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

function Step({ n, title, done, current, children }: { n: number; title: string; done: boolean; current: boolean; children: React.ReactNode }) {
  return (
    <li className={`grid grid-cols-[2.75rem_1fr] gap-x-3 border-b border-rule py-5 ${current || done ? "" : "text-ink-soft"}`}>
      <span
        className={`flex h-9 w-9 items-center justify-center border-2 font-display text-2xl font-black leading-none ${
          done ? "border-ink bg-ink text-paper" : current ? "border-ink" : "border-rule"
        }`}
        aria-hidden="true"
      >
        {done ? "✓" : n}
      </span>
      <div>
        <h3 className="text-lg font-bold leading-tight">
          {title}
          {done && <span className="sr-only"> (done)</span>}
        </h3>
        <div className="mt-1 text-[15px]">{children}</div>
      </div>
    </li>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-rule py-3">
      <dt className="font-semibold">{term}</dt>
      <dd className="mt-0.5 text-ink-soft">{children}</dd>
    </div>
  );
}
