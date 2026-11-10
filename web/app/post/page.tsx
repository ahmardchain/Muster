"use client";

import Link from "next/link";
import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ADDR, CHAIN_ID, CHECK, DEPLOYED, erc20Abi, musterAbi } from "@/lib/contracts";
import { isAddress, musd } from "@/lib/format";
import { useTx } from "@/lib/useTx";

type Kind = "loan" | "savings" | "token" | "custom";

const KINDS: { value: Kind; label: string; help: string }[] = [
  { value: "loan", label: "Open a MUSD loan on Mezo", help: "Passes when the wallet has an open loan (trove) on Mezo." },
  { value: "savings", label: "Save MUSD in Mezo savings", help: "Passes when the wallet holds at least this much sMUSD." },
  { value: "token", label: "Hold a token from my app", help: "Passes when the wallet holds at least this much of a token, such as a receipt or LP token." },
  { value: "custom", label: "My app's own rule", help: "Passes when your contract's completed(address) function returns true." },
];

const ZERO = "0x0000000000000000000000000000000000000000" as const;

function toUnits(v: string): bigint | null {
  try {
    const n = parseUnits(v.trim(), 18);
    return n > 0n ? n : null;
  } catch {
    return null;
  }
}

export default function PostPage() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const tx = useTx();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<Kind>("loan");
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("50");
  const [reward, setReward] = useState("5");
  const [slots, setSlots] = useState("10");
  const [days, setDays] = useState("7");
  const [posted, setPosted] = useState(false);

  const rewardWei = toUnits(reward);
  const slotCount = /^\d+$/.test(slots) ? Number(slots) : 0;
  const dayCount = /^\d+$/.test(days) ? Number(days) : 0;
  const total = rewardWei && slotCount > 0 ? rewardWei * BigInt(slotCount) : 0n;
  const thresholdWei = kind === "savings" || kind === "token" ? toUnits(amount) : 0n;

  const balance = useReadContract({
    address: ADDR.musd,
    abi: erc20Abi,
    chainId: CHAIN_ID,
    functionName: "balanceOf",
    args: [address ?? ZERO],
    query: { enabled: !!address, refetchInterval: 10_000 },
  });
  const allowance = useReadContract({
    address: ADDR.musd,
    abi: erc20Abi,
    chainId: CHAIN_ID,
    functionName: "allowance",
    args: [address ?? ZERO, ADDR.muster],
    query: { enabled: !!address && DEPLOYED },
  });

  const problems: string[] = [];
  if (!title.trim()) problems.push("Say what people must do.");
  if (new TextEncoder().encode(title).length > 80) problems.push("Keep the action under 80 characters.");
  if (url && !/^https:\/\//.test(url)) problems.push("The link must start with https://.");
  if (new TextEncoder().encode(url).length > 200) problems.push("Keep the link under 200 characters.");
  if ((kind === "token" || kind === "custom") && !isAddress(target)) problems.push("Enter the contract address to check.");
  if ((kind === "savings" || kind === "token") && !thresholdWei) problems.push("Enter the amount the wallet must hold.");
  if (!rewardWei) problems.push("Enter a reward above zero.");
  if (slotCount < 1) problems.push("Offer at least one place.");
  if (dayCount < 1 || dayCount > 90) problems.push("Run the quest for 1 to 90 days.");
  if (address && balance.data !== undefined && total > (balance.data as bigint)) {
    problems.push(`This wallet holds ${musd(balance.data as bigint)} MUSD, and the quest needs ${musd(total)}.`);
  }

  const needsApproval = total > 0n && ((allowance.data as bigint | undefined) ?? 0n) < total;

  async function submit() {
    if (!address) return openConnectModal?.();
    if (problems.length || !rewardWei) return;
    if (needsApproval) {
      const ok = await tx.send("approve", { address: ADDR.musd, abi: erc20Abi, functionName: "approve", args: [ADDR.muster, total] });
      await allowance.refetch();
      if (!ok) return;
    }
    const check = kind === "loan" ? CHECK.TroveActive : kind === "custom" ? CHECK.Custom : CHECK.BalanceAtLeast;
    const checkTarget = kind === "loan" ? ZERO : kind === "savings" ? ADDR.smusd : (target as `0x${string}`);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + dayCount * 86400);
    const ok = await tx.send("post", {
      address: ADDR.muster,
      abi: musterAbi,
      functionName: "createQuest",
      args: [check, checkTarget, thresholdWei ?? 0n, rewardWei, slotCount, deadline, title.trim(), url.trim()],
    });
    if (ok) setPosted(true);
  }

  if (!DEPLOYED) return <p className="notice mt-12 max-w-prose">The Muster contract isn&rsquo;t connected yet.</p>;

  if (posted) {
    return (
      <div className="max-w-prose pt-12">
        <h1 className="font-display text-6xl font-black leading-none tracking-tight">Quest posted</h1>
        <p className="mt-4 text-lg text-ink-soft">
          {musd(total)} MUSD is now in Mezo savings, waiting for {slotCount} wallet{slotCount === 1 ? "" : "s"} to complete it.
        </p>
        <Link href="/#quests" className="btn mt-6">
          See it in the list
        </Link>
      </div>
    );
  }

  const active = KINDS.find((k) => k.value === kind)!;

  return (
    <div className="grid gap-12 pt-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
      <form
        className="max-w-prose"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <h1 className="font-display text-[clamp(2.6rem,7vw,4.5rem)] font-black leading-[0.95] tracking-tight">Post a quest</h1>
        <p className="mt-4 text-lg text-ink-soft">Put MUSD behind an action. Wallets that do it get paid; you get real users you can see on-chain.</p>

        <div className="mt-8 space-y-6">
          <div>
            <label className="label" htmlFor="title">
              What must people do?
            </label>
            <input id="title" className="field" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Open a loan through Example App" />
          </div>
          <div>
            <label className="label" htmlFor="url">
              Where do they do it? (optional)
            </label>
            <input id="url" className="field" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-app.xyz" />
          </div>

          <fieldset>
            <legend className="label">How should the contract check it?</legend>
            <div className="border-2 border-ink">
              {KINDS.map((k) => (
                <label key={k.value} className={`flex cursor-pointer items-center gap-3 border-b border-rule px-3 py-3 last:border-b-0 ${kind === k.value ? "bg-raised font-semibold" : ""}`}>
                  <input type="radio" name="kind" className="h-4 w-4 accent-ink" checked={kind === k.value} onChange={() => setKind(k.value)} />
                  {k.label}
                </label>
              ))}
            </div>
            <p className="hint">{active.help}</p>
          </fieldset>

          {(kind === "token" || kind === "custom") && (
            <div>
              <label className="label" htmlFor="target">
                {kind === "token" ? "Token contract address" : "Your check contract address"}
              </label>
              <input id="target" className="field" value={target} onChange={(e) => setTarget(e.target.value.trim())} placeholder="0x…" spellCheck={false} />
            </div>
          )}
          {(kind === "savings" || kind === "token") && (
            <div>
              <label className="label" htmlFor="amount">
                Minimum amount the wallet must hold
              </label>
              <input id="amount" className="field" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              {kind === "token" && <p className="hint">Counted with 18 decimals, like MUSD. For tokens with other decimals or for NFTs, use your app&rsquo;s own rule.</p>}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label" htmlFor="reward">
                MUSD each
              </label>
              <input id="reward" className="field" inputMode="decimal" value={reward} onChange={(e) => setReward(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="slots">
                Places
              </label>
              <input id="slots" className="field" inputMode="numeric" value={slots} onChange={(e) => setSlots(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="days">
                Days open
              </label>
              <input id="days" className="field" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t-2 border-ink pt-5">
          <p className="font-display text-5xl font-black leading-none">
            {musd(total)} <span className="text-2xl font-bold">MUSD to escrow</span>
          </p>
          {address && balance.data !== undefined && <p className="hint">Your wallet holds {musd(balance.data as bigint)} MUSD.</p>}
          <button type="submit" className="btn mt-5" disabled={!!tx.busy || (!!address && problems.length > 0)}>
            {tx.busy === "approve"
              ? "Approving MUSD…"
              : tx.busy === "post"
                ? "Posting quest…"
                : !address
                  ? "Connect wallet to post"
                  : needsApproval
                    ? "Approve MUSD and post quest"
                    : "Post quest"}
          </button>
          {needsApproval && address && problems.length === 0 && <p className="hint">Your wallet will ask twice: once to approve the MUSD, once to post.</p>}
          <div aria-live="polite" className="mt-4 space-y-2">
            {address && problems.length > 0 && (
              <ul className="notice list-inside list-disc">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            {tx.error && <p className="notice">{tx.error}</p>}
          </div>
        </div>
      </form>

      <aside className="md:pt-24" aria-labelledby="terms">
        <h2 id="terms" className="font-display text-3xl font-black leading-none">
          Before you post
        </h2>
        <dl className="mt-5 border-t-2 border-ink text-[15px]">
          <Term name="No fee">Posting and paying out cost nothing beyond network fees. Muster keeps the savings yield your escrow earns while it waits.</Term>
          <Term name="Locked until the deadline">You can&rsquo;t cancel early. People who joined are owed the time they were shown.</Term>
          <Term name="Unclaimed MUSD comes back">After the deadline, close the quest to take back every place that wasn&rsquo;t paid.</Term>
          <Term name="What it proves">That a wallet did the action after joining. It doesn&rsquo;t prove they stayed, and one person can use several wallets, so price rewards with that in mind.</Term>
        </dl>
      </aside>
    </div>
  );
}

function Term({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-rule py-3">
      <dt className="font-semibold">{name}</dt>
      <dd className="mt-0.5 text-ink-soft">{children}</dd>
    </div>
  );
}
