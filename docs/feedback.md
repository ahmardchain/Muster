# Builder feedback for the Mezo team

Notes from building Muster on Mezo testnet during Wave 2.

## What was great

- MUSD's contracts are open and the deployment artifacts in `mezo-org/musd` made it easy to confirm addresses.
- The MUSD Savings Rate vault's source is verified on the testnet explorer, so its real interface could be read directly.
- Testnet RPC and explorer were fast and reliable for reads, writes and contract verification.
- The faucet plus testnet.mezo.org's borrow flow gets a new wallet to MUSD in a few minutes.

## Friction we hit

- **sMUSD is not ERC-4626.** Many builders will assume it is. It uses `deposit(uint256)`, `withdraw(uint256)` and a separate `claimYield()`, and `withdraw` auto-claims yield to the caller. A short "integrating sMUSD" page with these points and the address per network would save time.
- **Mezo Passport install.** `@mezo-org/passport` 0.17.x needed `--legacy-peer-deps`, an older RainbowKit (2.0.2) and a pinned wagmi (2.12.17) to build. Two OrangeKit packages ship TypeScript source, so Next.js needed `transpilePackages`. A version matrix or a minimal Next.js example in the docs would help.
- **Minimum loan size.** The 1,800 MUSD minimum net debt plus the 200 MUSD gas deposit is large for "try Mezo for the first time" flows. Apps targeting small first-time users need an on-ramp or swap path to MUSD without opening a trove.
- **Explorer verification of flattened sources** returns a partial match when the file path differs from the one used at compile time. That is expected, but a note in the verification docs would stop builders from re-deploying to chase a full match.

## Ideas

- A public list of "actions Mezo wants users to try" (Stability Pool, LP, veBTC lock) that apps like Muster could turn into quests.
- An official Multicall3 note for Mezo testnet and mainnet in the developer docs.
