# Changelog

## Wave 2 (November 2026)

- Muster contract: quests escrowed in MUSD and parked in Mezo's MUSD Savings Rate vault; join-before-act; on-chain checks for active troves, token balances and custom rules; refunds after the deadline; yield sweep to the treasury. No owner, no upgrade, no pause.
- 15 Hardhat tests with the escrow invariant asserted throughout.
- Deployed and source-verified on Mezo testnet at `0x4639eA15F20DF8C35D1AD80EAA6E884182823fc4`.
- Web app: quest list, quest page (join, act, claim), post a quest, readable without a wallet, Mezo Passport for wallets. Static export hosted on Cloudflare Workers.
- `/demo`: a simulated demo wallet that follows the contract's rules, for judges without a testnet wallet.
- First on-chain loop on testnet: post, join, save on Mezo, claim paid out of sMUSD.
