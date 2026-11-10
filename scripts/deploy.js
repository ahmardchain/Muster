// Deploy Muster to Mezo testnet:
//   DEPLOYER_KEY=0x... TREASURY=0x... npx hardhat run scripts/deploy.js --network mezotestnet
const { ethers, network } = require("hardhat");
const addresses = require("../addresses.json");

async function main() {
  const net = addresses[network.name];
  if (!net) throw new Error(`No addresses for network "${network.name}"`);
  const treasury = process.env.TREASURY;
  if (!treasury || !ethers.isAddress(treasury)) throw new Error("Set TREASURY to the wallet that receives savings yield");

  const savings = await ethers.getContractAt("IMUSDSavingsRate", net.sMUSD);
  const vaultMusd = await savings.musdToken();
  if (vaultMusd.toLowerCase() !== net.MUSD.toLowerCase()) throw new Error("sMUSD vault does not use the expected MUSD token");

  const muster = await (await ethers.getContractFactory("Muster")).deploy(net.MUSD, net.sMUSD, net.TroveManager, treasury);
  await muster.waitForDeployment();
  console.log("Muster deployed to", muster.target);
  console.log(`Verify: ${net.explorer}address/${muster.target}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
