# Muster

**Real users for Mezo apps, paid in MUSD, proven on-chain.**

A Mezo app posts a quest ("open a trove", "hold 50 sMUSD", or its own rule) and escrows MUSD.
A user joins, does the action, and claims. The contract checks the action itself.
While a quest is open, its escrow sits in Mezo's MUSD Savings Rate vault (sMUSD).

Status: contract, tests and web app are written. Not deployed to Mezo testnet yet.

## How it works

| Step | Call | What the contract enforces |
|---|---|---|
| Post | `createQuest` | Pulls `reward × slots` MUSD and deposits all of it into sMUSD; stores a title and link so users know what to do |
| Join | `join` | Reverts if the wallet already passes the check, so only actions taken after joining pay |
| Claim | `claim` | Re-checks on-chain, at least one block after joining, then withdraws from sMUSD and pays |
| Close | `closeQuest` | Creator gets unclaimed escrow back, only after the deadline |
| Revenue | `sweep` | Sends savings yield to the treasury; cannot move escrow |

Checks: `TroveActive` (Mezo TroveManager status), `BalanceAtLeast` (any ERC-20/721, e.g. sMUSD or LP tokens), `Custom` (any contract with `completed(address) → bool`).

No owner, no upgrade, no pause. Creators pay no fee: Muster earns the savings yield on idle escrow.

## Mezo pieces used (testnet, chain 31611)

| Piece | Address | Checked against |
|---|---|---|
| MUSD | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` | mezo-org/musd deployment artifacts |
| TroveManager | `0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0` | mezo-org/musd deployment artifacts |
| sMUSD (MUSD Savings Rate) | `0x6f461c68B2c5492C0F5CCEc5a264d692aA7A8e16` | Verified source on the testnet explorer; `musdToken()` and `yieldToken()` both return MUSD on-chain |

The sMUSD vault is not ERC-4626: `deposit(uint256)`, `withdraw(uint256)`, `claimYield()`, 1:1 shares.

## Run the tests

```
npm install --legacy-peer-deps
npx hardhat test
```

If the native compiler download is blocked, use `MUSTER_SOLCJS=1 npx hardhat test`.

## Web app

`web/` is a Next.js app: a quest list, a quest page (join, do the action, claim) and a page to post a quest.
Quests are readable without a wallet. Wallet connection uses Mezo Passport (RainbowKit).

```
cd web
cp .env.example .env.local   # set NEXT_PUBLIC_MUSTER_ADDRESS
npm install
npm run dev
```

To host it on Vercel, import the repo, set the root directory to `web`, and add the two variables from `.env.example`.

To try everything locally without Mezo: run `npx hardhat node`, then
`npx hardhat run scripts/local-seed.js --network localhost`, and paste the four lines it prints into `web/.env.local`.

## What has been tested

- 15 contract tests (Hardhat) against mocks shaped like the real vault and TroveManager.
- The web app's join, claim, post and refused-join flows, run in a browser against a local Hardhat chain.
- Not yet run against Mezo testnet, and wallet connection through Mezo Passport has not been tried with a real wallet.

## Known limits

- A wallet with capital can do an action, claim, and undo it. Muster proves the action happened after joining, not that the user stayed.
- One person can use many wallets. Quest creators should price rewards with that in mind.
- If the sMUSD vault cannot serve a withdrawal, claims and refunds wait until it can.
- Not audited.
