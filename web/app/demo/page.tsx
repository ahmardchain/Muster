"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";
import Roll from "@/components/Roll";
import { ADDR, CHAIN_ID, DEPLOYED, EXPLORER, erc20Abi, musterAbi, type Quest } from "@/lib/contracts";
import { musd, shortAddr } from "@/lib/format";

// A replay of quest 2 on Mezo testnet, built from its real transactions.
// The test wallet both posted and claimed it; that is stated on the page.
const QUEST_ID = 2;
const TEST_WALLET = "0x67561a4951B99AFE1018919dd3A3FDE883539b03" as const;

type Ledger = { escrow: number; paid: number; walletSavings: number; walletReward: number; joined: boolean };
type Tx = { label: string; hash: string };
type Step = { name: string; who: string; text: string; check: string; txs: Tx[]; ledger: Ledger };

const STEPS: Step[] = [
  {
    name: "Post",
    who: "A Mezo app",
    text: "Posts “Save 50 MUSD in Mezo’s savings vault” at 5 MUSD for each of 10 wallets. Muster pulls 50 MUSD and deposits all of it into Mezo’s MUSD Savings Rate vault in the same transaction.",
    check: "The vault must credit the full 50, or the whole post reverts.",
    txs: [{ label: "createQuest", hash: "0x19bc2f6f7c4600b8edaea28634c112ad63f837438f07536112b0fc00f177efed" }],
    ledger: { escrow: 50, paid: 0, walletSavings: 0, walletReward: 0, joined: false },
  },
  {
    name: "Join",
    who: "A user",
    text: "Joins the quest before doing anything. Muster records the block it joined in.",
    check: "Join is refused if the wallet already holds 50 sMUSD, so the app only pays for new usage. This wallet held none.",
    txs: [{ label: "join", hash: "0xe53aee4a7cda8a1f8e00097e7c7c8408585c596d59ceb15147ba972a875ef0f0" }],
    ledger: { escrow: 50, paid: 0, walletSavings: 0, walletReward: 0, joined: true },
  },
  {
    name: "Use Mezo",
    who: "The same user",
    text: "Deposits 50 MUSD into Mezo savings, directly on Mezo’s own vault. Muster is not involved in this step.",
    check: "Nothing to check yet. The action simply happens on Mezo.",
    txs: [
      { label: "approve", hash: "0x349dc5e85b313694fb86f567e147af5d5600f8e9499d8295c4305b889e436c58" },
      { label: "deposit", hash: "0xd72499f7e98305dcd8b962eccef3866339f08dba173c97097d744721188b6744" },
    ],
    ledger: { escrow: 50, paid: 0, walletSavings: 50, walletReward: 0, joined: true },
  },
  {
    name: "Claim",
    who: "The same user",
    text: "Claims. Muster withdraws 5 MUSD from the savings vault and sends it to the wallet. The other 45 MUSD stays in the vault for the next nine wallets.",
    check: "The wallet holds at least 50 sMUSD, joined in an earlier block, and hasn’t claimed before. All three are read on-chain.",
    txs: [{ label: "claim", hash: "0x6a75775dcc36df2523860b83db94a46c7811e284fff8bedd7dbed880560fc3ab" }],
    ledger: { escrow: 45, paid: 1, walletSavings: 50, walletReward: 5, joined: true },
  },
];

const base = { address: ADDR.muster, abi: musterAbi, chainId: CHAIN_ID } as const;

export default function DemoPage() {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const prev = i > 0 ? STEPS[i - 1].ledger : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea|select/i.test(t.tagName)) return;
      if (e.key === "ArrowRight") setI((n) => Math.min(STEPS.length - 1, n + 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <section className="border-b border-ink py-10 md:py-14">
        <h1 className="max-w-[18ch] font-display text-[clamp(2.6rem,7vw,4.75rem)] font-black leading-[0.95] tracking-tight">
          Watch one payout, start to finish
        </h1>
        <p className="mt-5 max-w-prose text-lg text-ink-soft">
          This replays quest {QUEST_ID} on Mezo testnet using its real transactions. No wallet needed: step through it, open any
          transaction on the explorer, then check the live numbers at the bottom.
        </p>
      </section>

      <section aria-labelledby="replay" className="pt-10">
        <h2 id="replay" className="sr-only">
          Replay
        </h2>
        <ol className="grid grid-cols-4 border-t-2 border-ink" role="tablist" aria-label="Steps">
          {STEPS.map((s, n) => (
            <li key={s.name} className="border-r border-rule last:border-r-0">
              <button
                role="tab"
                aria-selected={n === i}
                aria-controls="step-panel"
                onClick={() => setI(n)}
                className={`flex w-full items-baseline gap-2 px-2 py-3 text-left sm:px-4 ${n === i ? "bg-ink text-paper" : n < i ? "text-ink" : "text-ink-soft"}`}
              >
                <span className="font-display text-2xl font-black leading-none sm:text-3xl">{n + 1}</span>
                <span className="text-[15px] font-semibold leading-tight">{s.name}</span>
              </button>
            </li>
          ))}
        </ol>

        <div id="step-panel" role="tabpanel" aria-live="polite" className="grid gap-10 border-b border-rule py-8 md:grid-cols-[1.3fr_1fr] md:gap-16">
          <div>
            <p className="text-[15px] font-semibold text-ink-soft">{step.who}</p>
            <p className="mt-2 text-xl leading-snug">{step.text}</p>
            <div className="mt-6 border-l-4 border-ink bg-raised px-4 py-3">
              <p className="text-[15px] font-semibold">What the contract checks</p>
              <p className="mt-1 text-[15px] text-ink-soft">{step.check}</p>
            </div>
            <p className="mt-6 text-[15px] font-semibold">On the Mezo explorer</p>
            <ul className="mt-2 space-y-1.5">
              {step.txs.map((t) => (
                <li key={t.hash} className="text-[15px]">
                  <a className="underline underline-offset-2" href={`${EXPLORER}/tx/${t.hash}`} target="_blank" rel="noreferrer">
                    {t.label} transaction {shortAddr(t.hash)}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-3">
              <button className="btn-quiet" onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
                Back
              </button>
              {i < STEPS.length - 1 ? (
                <button className="btn" onClick={() => setI((n) => n + 1)}>
                  Next: {STEPS[i + 1].name}
                </button>
              ) : (
                <a className="btn" href="#live">
                  Check the live numbers
                </a>
              )}
            </div>
            <p className="hint">The arrow keys also move between steps.</p>
          </div>

          <div>
            <p className="font-display text-3xl font-black leading-none">After this step</p>
            <dl className="mt-4 border-t-2 border-ink text-[15px]">
              <Row term="Held for this quest in Mezo savings" value={`${step.ledger.escrow} MUSD`} changed={!!prev && prev.escrow !== step.ledger.escrow} />
              <Row term="User has joined" value={step.ledger.joined ? "Yes" : "No"} changed={!!prev && prev.joined !== step.ledger.joined} />
              <Row term="User’s Mezo savings" value={`${step.ledger.walletSavings} sMUSD`} changed={!!prev && prev.walletSavings !== step.ledger.walletSavings} />
              <Row term="Paid to the user" value={`${step.ledger.walletReward} MUSD`} changed={!!prev && prev.walletReward !== step.ledger.walletReward} />
            </dl>
            <div className="mt-5">
              <Roll slots={10} slotsLeft={10 - step.ledger.paid} size="lg" />
            </div>
          </div>
        </div>
        <p className="mt-4 max-w-prose text-sm text-ink-soft">
          In this test the user was the poster&rsquo;s own wallet ({shortAddr(TEST_WALLET)}). The contract treats every wallet the same way.
        </p>
      </section>

      <Live />

      <section aria-labelledby="yourself" className="pt-12">
        <h2 id="yourself" className="font-display text-4xl font-black leading-none tracking-tight">
          Try it with a wallet
        </h2>
        <ol className="mt-5 max-w-prose list-decimal space-y-2 pl-5 text-[17px]">
          <li>
            Add Mezo testnet to your wallet and get test BTC from the{" "}
            <a className="underline underline-offset-2" href="https://faucet.test.mezo.org" target="_blank" rel="noreferrer">
              Mezo faucet
            </a>
            .
          </li>
          <li>
            Open a quest from the{" "}
            <Link className="underline underline-offset-2" href="/#quests">
              list
            </Link>{" "}
            and join it.
          </li>
          <li>Do the action on testnet.mezo.org with the same wallet, then come back and claim.</li>
        </ol>
      </section>
    </>
  );
}

function Row({ term, value, changed }: { term: string; value: string; changed: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 border-b border-rule px-2 py-3 ${changed ? "bg-raised" : ""}`}>
      <dt className={changed ? "font-semibold" : "text-ink-soft"}>{term}</dt>
      <dd className="font-display text-2xl font-black leading-none">
        {value}
        {changed && <span className="sr-only"> (changed)</span>}
      </dd>
    </div>
  );
}

/** Numbers read from Mezo testnet right now, so a judge can see the replay matches the chain. */
function Live() {
  const r = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...base, functionName: "getQuest", args: [BigInt(QUEST_ID)] },
      { ...base, functionName: "escrowed" },
      { address: ADDR.smusd, abi: erc20Abi, chainId: CHAIN_ID, functionName: "balanceOf", args: [ADDR.muster] },
      { ...base, functionName: "claimed", args: [BigInt(QUEST_ID), TEST_WALLET] },
    ],
    query: { enabled: DEPLOYED, refetchInterval: 15_000 },
  });
  const [q, escrowed, held, claimed] = r.data ?? [];
  const quest = q?.status === "success" ? (q.result as unknown as Quest) : undefined;
  const ok = (x?: { status: string }) => x?.status === "success";

  return (
    <section id="live" aria-labelledby="live-h" className="scroll-mt-6 pt-12">
      <h2 id="live-h" className="font-display text-4xl font-black leading-none tracking-tight">
        Live from Mezo testnet
      </h2>
      <p className="mt-3 max-w-prose text-ink-soft">Read from the contract just now, and every 15 seconds while this page is open.</p>
      {r.isLoading && <p className="mt-6 text-ink-soft">Reading Mezo…</p>}
      {r.error && <p className="notice mt-6 max-w-prose">Couldn&rsquo;t reach Mezo testnet. Reload the page to try again.</p>}
      {r.data && (
        <dl className="mt-6 grid border-t-2 border-ink text-[15px] sm:grid-cols-2 sm:gap-x-10">
          <Fact term={`Quest ${QUEST_ID} places paid`} value={quest ? `${quest.slots - quest.slotsLeft} of ${quest.slots}` : "Unavailable"} />
          <Fact term={`Test wallet has claimed quest ${QUEST_ID}`} value={ok(claimed) ? ((claimed!.result as boolean) ? "Yes" : "No") : "Unavailable"} />
          <Fact term="MUSD the contract owes across all quests" value={ok(escrowed) ? `${musd(escrowed!.result as bigint)} MUSD` : "Unavailable"} />
          <Fact term="sMUSD the contract holds in Mezo savings" value={ok(held) ? `${musd(held!.result as bigint)} sMUSD` : "Unavailable"} />
        </dl>
      )}
      <p className="mt-4 max-w-prose text-sm text-ink-soft">
        The last two always match: every MUSD owed sits in Mezo savings until it is paid out.{" "}
        <a className="underline underline-offset-2" href={`${EXPLORER}/address/${ADDR.muster}?tab=contract`} target="_blank" rel="noreferrer">
          Read the verified contract
        </a>
        .
      </p>
    </section>
  );
}

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
      <dt className="text-ink-soft">{term}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
