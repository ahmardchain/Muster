"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import Roll from "@/components/Roll";
import { ADDR, CHAIN_ID, DEPLOYED, musterAbi } from "@/lib/contracts";
import { musd, questState, timeLeft } from "@/lib/format";
import { useQuests } from "@/lib/useQuests";

const STEPS = [
  { name: "Join", text: "Pick a quest and join with your wallet, before you use the app." },
  { name: "Use the app", text: "Do what the quest asks: open a loan, save some MUSD, or try a new Mezo app." },
  { name: "Claim", text: "The contract checks your wallet on-chain and pays you in MUSD." },
];

export default function Home() {
  const { quests, isLoading, error } = useQuests();
  const escrow = useReadContract({
    address: ADDR.muster,
    abi: musterAbi,
    chainId: CHAIN_ID,
    functionName: "escrowed",
    query: { enabled: DEPLOYED, refetchInterval: 15_000 },
  });
  const open = quests.filter(({ q }) => questState(q) === "open");
  const paid = quests.reduce((n, { q }) => n + (q.slots - q.slotsLeft), 0);

  return (
    <>
      <section className="grid gap-10 border-b border-ink py-12 md:grid-cols-[1.25fr_1fr] md:gap-16 md:py-20">
        <div>
          <h1 className="font-display text-[clamp(2.9rem,8.5vw,6rem)] font-black leading-[0.92] tracking-tight">
            Use a Mezo app. Get paid in MUSD.
          </h1>
          <p className="mt-6 max-w-prose text-lg text-ink-soft">
            Mezo apps post quests to find real users. Nobody reviews screenshots: a contract reads your wallet on Mezo and pays you the
            moment the action is there.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#quests" className="btn">
              See open quests
            </Link>
            <Link href="/post" className="btn-quiet">
              Post a quest
            </Link>
          </div>
        </div>
        <ol className="self-end border-t-2 border-ink">
          {STEPS.map((s, i) => (
            <li key={s.name} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-rule py-4">
              <span className="font-display text-4xl font-black leading-none" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h2 className="text-lg font-bold leading-tight">{s.name}</h2>
                <p className="mt-1 text-[15px] text-ink-soft">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="quests" className="scroll-mt-6 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
          <h2 className="font-display text-5xl font-black leading-none tracking-tight">Quests</h2>
          {DEPLOYED && !isLoading && !error && (
            <p className="text-[15px] text-ink-soft">
              {open.length} open, {paid} wallet{paid === 1 ? "" : "s"} paid, {musd(escrow.data ?? 0n)} MUSD waiting in Mezo savings
            </p>
          )}
        </div>

        {!DEPLOYED && (
          <p className="notice mt-8 max-w-prose">
            The Muster contract isn&rsquo;t connected yet. Deploy it to Mezo testnet, then set <code>NEXT_PUBLIC_MUSTER_ADDRESS</code> to
            its address.
          </p>
        )}
        {DEPLOYED && isLoading && <p className="mt-8 text-ink-soft">Reading quests from Mezo…</p>}
        {DEPLOYED && error && (
          <p className="notice mt-8 max-w-prose">Couldn&rsquo;t read quests from Mezo. Check your connection and reload the page.</p>
        )}
        {DEPLOYED && !isLoading && !error && quests.length === 0 && (
          <div className="mt-8 max-w-prose">
            <p>No quests yet. Post the first one and put MUSD behind an action you want people to try.</p>
            <Link href="/post" className="btn mt-4">
              Post a quest
            </Link>
          </div>
        )}

        {quests.length > 0 && (
          <ul className="mt-8 border-t-2 border-ink">
            {quests.map(({ id, q }) => {
              const state = questState(q);
              return (
                <li key={id} className="border-b border-rule">
                  <Link
                    href={`/quest/${id}`}
                    className="grid gap-x-8 gap-y-3 py-5 hover:bg-raised sm:grid-cols-[1fr_9rem_13rem] sm:items-center sm:px-3"
                  >
                    <div>
                      <h3 className={`text-xl font-bold leading-snug ${state === "open" ? "" : "text-ink-soft"}`}>{q.title}</h3>
                      <p className="mt-0.5 text-[15px] text-ink-soft">
                        {state === "open" ? timeLeft(q.deadline) : state === "full" ? "All places paid" : "Ended"}
                      </p>
                    </div>
                    <p className="font-display text-4xl font-black leading-none">
                      {musd(q.reward)} <span className="text-xl font-bold">MUSD</span>
                    </p>
                    <Roll slots={q.slots} slotsLeft={q.slotsLeft} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
