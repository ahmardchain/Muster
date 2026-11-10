// Local test data only: deploys mocks + Muster to a Hardhat node and seeds quests.
//   npx hardhat node   (in one terminal)
//   npx hardhat run scripts/local-seed.js --network localhost
const { ethers } = require("hardhat");
const E = (n) => ethers.parseEther(String(n));

async function main() {
  const [creator, a, b, c, treasury] = await ethers.getSigners();
  const musd = await (await ethers.getContractFactory("MockMUSD")).deploy();
  const savings = await (await ethers.getContractFactory("MockSavings")).deploy(musd.target, musd.target);
  const tm = await (await ethers.getContractFactory("MockTroveManager")).deploy();
  const muster = await (await ethers.getContractFactory("Muster")).deploy(musd.target, savings.target, tm.target, treasury.address);
  await musd.mint(creator.address, E(5000));
  await musd.approve(muster.target, ethers.MaxUint256);
  const now = (await ethers.provider.getBlock("latest")).timestamp;
  const day = 86400;

  await muster.createQuest(0, ethers.ZeroAddress, 0, E(25), 12, now + 6 * day, "Open your first MUSD loan on Mezo", "https://testnet.mezo.org");
  await muster.createQuest(1, savings.target, E(50), E(5), 30, now + 12 * day, "Save 50 MUSD in Mezo savings", "https://testnet.mezo.org");
  await muster.createQuest(0, ethers.ZeroAddress, 0, E(10), 2, now + 3 * day, "Borrow MUSD through Example App", "https://example.org");

  for (const u of [a, b, c]) {
    await muster.connect(u).join(0);
    await tm.set(u.address, 1);
    await muster.connect(u).claim(0);
  }
  for (const u of [a, b]) {
    await musd.mint(u.address, E(50));
    await muster.connect(u).join(1);
    await musd.connect(u).approve(savings.target, E(50));
    await savings.connect(u).deposit(E(50));
    await muster.connect(u).claim(1);
  }
  console.log(`NEXT_PUBLIC_LOCAL_RPC=http://127.0.0.1:8545`);
  console.log(`NEXT_PUBLIC_MUSTER_ADDRESS=${muster.target}`);
  console.log(`NEXT_PUBLIC_MUSD_ADDRESS=${musd.target}`);
  console.log(`NEXT_PUBLIC_SMUSD_ADDRESS=${savings.target}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
