"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ADDR, DEPLOYED, EXPLORER, LOCAL_RPC } from "@/lib/contracts";
import { shortAddr } from "@/lib/format";

// Wallet libraries touch `window`, so the provider tree is browser-only.
const Providers = dynamic(() => import("./Providers"), {
  ssr: false,
  loading: () => <p className="mx-auto max-w-page px-4 py-24 text-ink-soft sm:px-8">Loading Muster…</p>,
});

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">
        Skip to content
      </a>
      <header className="border-b border-ink">
        <div className="mx-auto flex max-w-page flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-8">
          <Link href="/" className="font-display text-3xl font-black leading-none tracking-tight">
            Muster
          </Link>
          <nav aria-label="Main" className="flex gap-6 text-[15px] font-medium">
            <Link href="/#quests" className="underline-offset-4 hover:underline">
              Quests
            </Link>
            <Link href="/post" className="underline-offset-4 hover:underline">
              Post a quest
            </Link>
            <Link href="/demo" className="underline-offset-4 hover:underline">
              Demo
            </Link>
          </nav>
          <div className="ml-auto">
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-page px-4 pb-24 sm:px-8">
        {children}
      </main>
      <footer className="border-t border-rule">
        <div className="mx-auto max-w-page px-4 py-6 text-sm text-ink-soft sm:px-8">
          <p>
            Muster runs on Mezo testnet{LOCAL_RPC ? " (this copy is pointed at a local test chain)" : ""}. Rewards sit in Mezo&rsquo;s MUSD
            savings vault until they are claimed.
          </p>
          {DEPLOYED && (
            <p className="mt-1">
              Contract{" "}
              <a className="underline underline-offset-2" href={`${EXPLORER}/address/${ADDR.muster}`} target="_blank" rel="noreferrer">
                {shortAddr(ADDR.muster)}
              </a>{" "}
              has no owner and cannot be paused or upgraded. It is not audited.
            </p>
          )}
        </div>
      </footer>
    </Providers>
  );
}
