"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";
import Roll from "@/components/Roll";
import { ADDR, CHAIN_ID, DEPLOYED, EXPLORER, erc20Abi, musterAbi } from "@/lib/contracts";
import { musd, shortAddr } from "@/lib/format";
import * as D from "@/lib/demo";

const KEY = "muster-demo-v1";

function load(): D.DemoState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as D.DemoState) : null;
  } catch {
    return null;
  }
}

function persist(s: D.DemoState | null) {
  try {
    if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* demo still works without storage */
  }
}

const n = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 4 });

export default function DemoPage() {
  const [s, setS] = useState<D.DemoState | null>(null);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setS(load());
    setReady(true);
  }, []);

  function run(r: D.Result) {
    if (r.ok) {
      setS(r.state);
      persist(r.state);
      setMsg({ ok: true, text: r.message });
    } else {
      setMsg({ ok: false, text: r.error });
    }
  }

  function start() {
    const fresh = D.initialState();
    setS(fresh);
    persist(fresh);
    setMsg({ ok: true, text: "Your demo wallet has 1,000 MUSD and 0.05 BTC. Pick a quest below and join it." });
  }

  function reset() {
    persist(null);
    setS(null);
    setMsg(null);
  }

  return (
    <>
      <section className="border-b border-ink py-10 md:py-14">
        <h1 className="max-w-[16ch] font-display text-[clamp(2.6rem,7vw,4.75rem)] font-black leading-[0.95] tracking-tight">
          Try Muster with a demo wallet
        </h1>
        <p className="mt-5 max-w-prose text-lg text-ink-soft">
          Get a wallet with pretend MUSD and BTC, then post a quest, join one, do the action on a pretend Mezo, and claim. The rules
          are the real contract&rsquo;s, so the same things are allowed and refused.
        </p>
        <p className="notice mt-6 max-w-prose">
          Demo mode: balances are pretend and nothing is sent to Mezo. The real transactions are at the{" "}
          <a href="#real" className="underline underline-offset-2">
            bottom of this page
          </a>
          .
        </p>
        {ready && !s && (
          <button className="btn mt-6" onClick={start}>
            Start the demo
          </button>
        )}
      </section>

      {s && <Sandbox s={s} run={run} msg={msg} reset={reset} />}

      <Real />
    </>
  );
}

function Sandbox({ s, run, msg, reset }: { s: D.DemoState; run: (r: D.Result) => void; msg: { ok: boolean; text: string } | null; reset: () => void }) {
  return (
    <div className="grid gap-10 pt-10 md:grid-cols-[1.45fr_1fr] md:gap-14">
      <div className="min-w-0">
        <div aria-live="polite" className="min-h-[3.25rem]">
          {msg && (
            <p className={`border-l-4 bg-raised px-4 py-3 text-[15px] ${msg.ok ? "border-ink font-medium" : "border-stamp"}`}>{msg.text}</p>
          )}
        </div>

        <section aria-labelledby="dq" className="mt-6">
          <h2 id="dq" className="font-display text-4xl font-black leading-none tracking-tight">
            Quests
          </h2>
          <ul className="mt-5 border-t-2 border-ink">
            {s.quests.map((q) => (
              <QuestRow key={q.id} s={s} q={q} run={run} />
            ))}
          </ul>
        </section>

        <PostForm s={s} run={run} />
      </div>

      <aside className="min-w-0 space-y-10" aria-label="Demo wallet and pretend Mezo">
        <section aria-labelledby="dw">
          <h2 id="dw" className="font-display text-3xl font-black leading-none">
            Demo wallet
          </h2>
          <dl className="mt-4 border-t-2 border-ink text-[15px]">
            <Bal term="MUSD" value={n(s.wallet.musd)} />
            <Bal term="BTC" value={n(s.wallet.btc)} />
            <Bal term="Saved in Mezo (sMUSD)" value={n(s.wallet.savings)} />
            <Bal term="MUSD loan" value={s.wallet.loan ? `${n(s.wallet.loan.debt)} owed` : "None"} />
          </dl>
        </section>

        <section aria-labelledby="dm">
          <h2 id="dm" className="font-display text-3xl font-black leading-none">
            Pretend Mezo
          </h2>
          <p className="mt-2 text-[15px] text-ink-soft">Do quest actions here, the way you would on testnet.mezo.org.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {s.wallet.loan ? (
              <button className="btn-quiet" onClick={() => run(D.repayLoan(s))}>
                Repay loan
              </button>
            ) : (
              <button className="btn-quiet" onClick={() => run(D.openLoan(s))}>
                Open a loan
              </button>
            )}
            <button className="btn-quiet" onClick={() => run(D.save(s))}>
              Save {D.SAVE_AMOUNT} MUSD
            </button>
            <button className="btn-quiet col-span-2" disabled={s.wallet.savings < D.SAVE_AMOUNT} onClick={() => run(D.withdrawSavings(s))}>
              Withdraw {D.SAVE_AMOUNT} from savings
            </button>
          </div>
          <p className="hint">
            A loan locks {D.LOAN.collateral} BTC and borrows {n(D.LOAN.borrow)} MUSD, Mezo&rsquo;s minimum.
          </p>
        </section>

        <section aria-labelledby="dc">
          <h2 id="dc" className="font-display text-3xl font-black leading-none">
            Day {s.day}
          </h2>
          <p className="mt-2 text-[15px] text-ink-soft">Skip ahead to see quests end and to take back unclaimed MUSD.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="btn-quiet" onClick={() => run(D.skipWeek(s))}>
              Skip a week
            </button>
            <button className="btn-quiet" onClick={reset}>
              Reset the demo
            </button>
          </div>
        </section>

        <section aria-labelledby="dl">
          <h2 id="dl" className="font-display text-3xl font-black leading-none">
            What happened
          </h2>
          <ol className="mt-4 border-t-2 border-ink text-[15px]">
            {s.log.slice(0, 8).map((l) => (
              <li key={l.block} className="border-b border-rule py-2.5 text-ink-soft">
                {l.text}
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}

function QuestRow({ s, q, run }: { s: D.DemoState; q: D.DemoQuest; run: (r: D.Result) => void }) {
  const open = D.isOpen(s, q);
  const joined = s.joined[q.id] !== undefined;
  const claimed = !!s.claimed[q.id];
  const passes = D.passes(s, q);
  const daysLeft = q.deadline - s.day;
  const status = q.closed
    ? "Closed"
    : !open
      ? q.slotsLeft === 0
        ? "All places paid"
        : "Ended"
      : `${daysLeft === 0 ? "Last day" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}`;
  const rule = q.check === "loan" ? "Passes when your wallet has an open MUSD loan on Mezo." : `Passes when your wallet holds at least ${n(q.threshold)} sMUSD.`;
  const yours = q.creator === "you";

  let step: string;
  if (claimed) step = `Paid: ${n(q.reward)} MUSD went to your wallet.`;
  else if (!open) step = joined ? "This quest ended before you claimed." : "";
  else if (!joined) step = passes ? "Your wallet already passes this check, so it can't join. Undo the action on Mezo first to try." : "Step 1: join, before you do the action.";
  else if (!passes) step = "Step 2: do the action on pretend Mezo.";
  else step = "Step 3: the check passes. Claim your reward.";

  return (
    <li className="border-b border-rule py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className={`text-xl font-bold leading-snug ${open ? "" : "text-ink-soft"}`}>{q.title}</h3>
        <p className="font-display text-3xl font-black leading-none">
          {n(q.reward)} <span className="text-lg font-bold">MUSD</span>
        </p>
      </div>
      <p className="mt-1 text-[15px] text-ink-soft">
        {status}. {rule} {yours ? "Posted by you." : "Posted by a Mezo app."}
      </p>
      <div className="mt-3">
        <Roll slots={q.slots} slotsLeft={q.slotsLeft} />
      </div>
      {step && <p className="mt-3 text-[15px] font-medium">{step}</p>}
      <div className="mt-3 flex flex-wrap gap-3">
        {open && !joined && (
          <button className="btn" onClick={() => run(D.join(s, q.id))}>
            Join quest
          </button>
        )}
        {open && joined && !claimed && (
          <button className="btn" disabled={!passes} onClick={() => run(D.claim(s, q.id))}>
            {passes ? `Claim ${n(q.reward)} MUSD` : "Check not passed yet"}
          </button>
        )}
        {yours && !q.closed && (
          <button className="btn-quiet" disabled={s.day <= q.deadline} onClick={() => run(D.closeQuest(s, q.id))}>
            Close and take back {n(q.reward * q.slotsLeft)} MUSD
          </button>
        )}
      </div>
    </li>
  );
}

function PostForm({ s, run }: { s: D.DemoState; run: (r: D.Result) => void }) {
  const [title, setTitle] = useState("Save 50 MUSD with my app");
  const [check, setCheck] = useState<D.Check>("savings");
  const [threshold, setThreshold] = useState("50");
  const [reward, setReward] = useState("5");
  const [slots, setSlots] = useState("10");
  const [days, setDays] = useState("7");
  const total = (Number(reward) || 0) * (Number(slots) || 0);

  return (
    <section aria-labelledby="dp" className="mt-12">
      <h2 id="dp" className="font-display text-4xl font-black leading-none tracking-tight">
        Post a quest
      </h2>
      <p className="mt-2 max-w-prose text-[15px] text-ink-soft">The reward comes out of your demo wallet and waits in Mezo savings until someone claims it.</p>
      <form
        className="mt-5 max-w-prose space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          run(D.postQuest(s, { title, check, threshold: Number(threshold), reward: Number(reward), slots: Number(slots), days: Number(days) }));
        }}
      >
        <div>
          <label className="label" htmlFor="d-title">
            What must people do?
          </label>
          <input id="d-title" className="field" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <fieldset>
          <legend className="label">How should it be checked?</legend>
          <div className="border-2 border-ink">
            {(
              [
                ["savings", "Save MUSD in Mezo savings"],
                ["loan", "Open a MUSD loan on Mezo"],
              ] as const
            ).map(([v, label]) => (
              <label key={v} className={`flex cursor-pointer items-center gap-3 border-b border-rule px-3 py-3 last:border-b-0 ${check === v ? "bg-raised font-semibold" : ""}`}>
                <input type="radio" name="d-check" className="h-4 w-4 accent-ink" checked={check === v} onChange={() => setCheck(v)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {check === "savings" && (
          <div>
            <label className="label" htmlFor="d-threshold">
              Minimum sMUSD the wallet must hold
            </label>
            <input id="d-threshold" className="field" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="d-reward">
              MUSD each
            </label>
            <input id="d-reward" className="field" inputMode="decimal" value={reward} onChange={(e) => setReward(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="d-slots">
              Places
            </label>
            <input id="d-slots" className="field" inputMode="numeric" value={slots} onChange={(e) => setSlots(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="d-days">
              Days open
            </label>
            <input id="d-days" className="field" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn">
          Post quest for {n(total)} MUSD
        </button>
      </form>
    </section>
  );
}

function Bal({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
      <dt className="text-ink-soft">{term}</dt>
      <dd className="font-display text-2xl font-black leading-none">{value}</dd>
    </div>
  );
}

// ---- The real thing, on Mezo testnet ----

const QUEST_ID = 2;
const TEST_WALLET = "0x67561a4951B99AFE1018919dd3A3FDE883539b03" as const;
const REAL_TXS = [
  { step: "Post", text: "A quest posted; 50 MUSD moved into Mezo savings", hash: "0x19bc2f6f7c4600b8edaea28634c112ad63f837438f07536112b0fc00f177efed" },
  { step: "Join", text: "A wallet joined before acting", hash: "0xe53aee4a7cda8a1f8e00097e7c7c8408585c596d59ceb15147ba972a875ef0f0" },
  { step: "Use Mezo", text: "The wallet saved 50 MUSD on Mezo's own vault", hash: "0xd72499f7e98305dcd8b962eccef3866339f08dba173c97097d744721188b6744" },
  { step: "Claim", text: "Muster checked it and paid 5 MUSD out of savings", hash: "0x6a75775dcc36df2523860b83db94a46c7811e284fff8bedd7dbed880560fc3ab" },
];
const base = { address: ADDR.muster, abi: musterAbi, chainId: CHAIN_ID } as const;

function Real() {
  const r = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...base, functionName: "getQuest", args: [BigInt(QUEST_ID)] },
      { ...base, functionName: "escrowed" },
      { address: ADDR.smusd, abi: erc20Abi, chainId: CHAIN_ID, functionName: "balanceOf", args: [ADDR.muster] },
    ],
    query: { enabled: DEPLOYED, refetchInterval: 15_000 },
  });
  const [q, escrowed, held] = r.data ?? [];
  const quest = q?.status === "success" ? (q.result as unknown as { slots: number; slotsLeft: number }) : undefined;

  return (
    <section id="real" aria-labelledby="real-h" className="mt-16 scroll-mt-6 border-t border-ink pt-12">
      <h2 id="real-h" className="font-display text-4xl font-black leading-none tracking-tight">
        The same flow, for real
      </h2>
      <p className="mt-3 max-w-prose text-ink-soft">
        Quest {QUEST_ID} on Mezo testnet, step by step. In this test the user was the poster&rsquo;s own wallet ({shortAddr(TEST_WALLET)}).
      </p>
      <ol className="mt-6 border-t-2 border-ink">
        {REAL_TXS.map((t, i) => (
          <li key={t.hash} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-rule py-3">
            <span className="font-display text-3xl font-black leading-none" aria-hidden="true">
              {i + 1}
            </span>
            <div className="text-[15px]">
              <p className="font-semibold">{t.step}</p>
              <p className="text-ink-soft">
                {t.text}.{" "}
                <a className="underline underline-offset-2" href={`${EXPLORER}/tx/${t.hash}`} target="_blank" rel="noreferrer">
                  View transaction
                </a>
              </p>
            </div>
          </li>
        ))}
      </ol>

      <h3 className="mt-10 font-display text-3xl font-black leading-none">Live from Mezo testnet</h3>
      {r.isLoading && <p className="mt-4 text-ink-soft">Reading Mezo…</p>}
      {r.data && (
        <dl className="mt-4 grid border-t-2 border-ink text-[15px] sm:grid-cols-3 sm:gap-x-8">
          <Fact term={`Quest ${QUEST_ID} places paid`} value={quest ? `${quest.slots - quest.slotsLeft} of ${quest.slots}` : "Unavailable"} />
          <Fact term="MUSD owed across all quests" value={escrowed?.status === "success" ? `${musd(escrowed.result as bigint)}` : "Unavailable"} />
          <Fact term="sMUSD held in Mezo savings" value={held?.status === "success" ? `${musd(held.result as bigint)}` : "Unavailable"} />
        </dl>
      )}
      <p className="mt-4 max-w-prose text-sm text-ink-soft">
        The last two always match: every MUSD owed waits in Mezo savings until it is paid.{" "}
        <a className="underline underline-offset-2" href={`${EXPLORER}/address/${ADDR.muster}?tab=contract`} target="_blank" rel="noreferrer">
          Read the verified contract
        </a>{" "}
        or{" "}
        <Link className="underline underline-offset-2" href="/#quests">
          try the real quests with your own wallet
        </Link>
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
