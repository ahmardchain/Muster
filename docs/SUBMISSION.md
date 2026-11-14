# AKINDO submission

Build with MUSD and MEZO, Wave 2. Kept in sync with the form on AKINDO.

| Field | Value |
|---|---|
| Product name | Muster |
| Tagline | Real users for Mezo apps: quests paid in MUSD, checked on-chain, escrow earning in Mezo savings. |
| Product type | Functional |
| Category | User Acquisition, Quests & Bounties, Payments |
| Track | Track 2: Access and Distribution |
| Chain | Mezo testnet |
| Deliverable | https://github.com/ahmardchain/Muster |
| Live demo | https://muster.ahmardchain.workers.dev |

## Updates in this wave

```
Muster: real users for Mezo apps, paid in MUSD, proven on-chain. Entirely new, built in Wave 2. Track 2 (Access and Distribution). Live on Mezo testnet.

TL;DR: Mezo apps post quests in MUSD ("open a MUSD loan", "save 50 MUSD in Mezo savings", or their own rule). A user joins, does the action on Mezo, and claims; the contract reads their wallet and pays them. No screenshots, no reviewers.

How it works
- Post: createQuest pulls reward x places in MUSD and deposits all of it into Mezo's MUSD Savings Rate vault (sMUSD), so idle escrow earns.
- Join: refused if the wallet already passes the check, so apps only pay for new usage.
- Claim: at least one block after joining, Muster re-checks on-chain (an active trove in TroveManager, an sMUSD or token balance, or the app's own completed(address) contract), withdraws the reward from sMUSD and pays it.
- Close: after the deadline the poster takes back unpaid places. Nobody can cancel early.
- Revenue: savings yield on idle escrow goes to the treasury. Posters pay no fee.
- No owner, no upgrade, no pause. External checks are gas-capped and wrapped so one bad check can't break other quests.

Try it
- Live app: https://muster.ahmardchain.workers.dev (quests load without a wallet)
- No wallet? Press "Try demo" for a demo wallet with pretend MUSD: post, join, act, claim, same rules as the contract.

Proof on Mezo testnet
- Contract (source verified): https://explorer.test.mezo.org/address/0x4639eA15F20DF8C35D1AD80EAA6E884182823fc4
- Post (escrow into sMUSD): https://explorer.test.mezo.org/tx/0x19bc2f6f7c4600b8edaea28634c112ad63f837438f07536112b0fc00f177efed
- Join: https://explorer.test.mezo.org/tx/0xe53aee4a7cda8a1f8e00097e7c7c8408585c596d59ceb15147ba972a875ef0f0
- Claim (paid out of sMUSD): https://explorer.test.mezo.org/tx/0x6a75775dcc36df2523860b83db94a46c7811e284fff8bedd7dbed880560fc3ab
Second wallet, full flow (join, save 50 MUSD on Mezo, claim): https://explorer.test.mezo.org/tx/0x6d157d0f36c97eeec50d6a80676b1f2e470ea67a6c8c672d6eecac947538b3a0
Both claims so far are from the team's own test wallets. 15 Hardhat tests cover escrow accounting, join/claim rules and refunds.

Target group: Mezo ecosystem teams that need verifiable first users, and users who want to try Mezo and get paid for it. Desktop and mobile wallet browsers.
Tech: Solidity 0.8.28, OpenZeppelin, Hardhat; Next.js static export, TypeScript, wagmi, viem, RainbowKit with Mezo Passport; Cloudflare Workers.
Chain: Mezo testnet. Readiness: testnet deployment.
Limits (stated in the README): it proves the action happened after joining, not that the user stayed; one person can use several wallets. Not audited.

Code: https://github.com/ahmardchain/Muster
Team: AHMARD (solo): product, contracts, frontend. X: https://x.com/ahmardchain
```

## Milestones

**Next (3rd wave box)**

```
Outside users and outside apps (about 4 weeks):
- Move from the workers.dev link to our own domain name.
- Refresh the UI: clearer quest pages, a dashboard for quest posters, and a smoother mobile flow.
- Bring 3 Mezo ecosystem teams to post quests on testnet, and get 25+ claims from wallets outside the team, with every payout linked on the explorer.
- Quest templates for common Mezo actions: Stability Pool deposit, BTC/MUSD liquidity, veBTC/veMEZO lock.
- A Telegram bot that alerts users to new quests and tells them when their claim is ready.
- Read the remaining Mezo state on-chain (Recovery Mode, minimum debt) and show it in the quest page.
```

**After that (4th wave box)**

```
Mainnet (about 6 weeks):
- External security review of the Muster contract, with every finding fixed or published.
- Capped mainnet launch on Mezo (escrow cap per quest and in total), contract source verified.
- First paid quests from Mezo apps on mainnet; public dashboard of quests, payouts and savings yield earned.
- Anti-farming options for posters: allowlists, minimum wallet age, and one claim per trove.
```
