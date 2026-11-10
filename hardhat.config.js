require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
const { subtask } = require("hardhat/config");
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require("hardhat/builtin-tasks/task-names");

// Offline/CI fallback: compile with the solc npm package instead of
// downloading a native compiler. Enable with MUSTER_SOLCJS=1.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args, hre, runSuper) => {
  if (process.env.MUSTER_SOLCJS !== "1") return runSuper();
  const solc = require("solc");
  return {
    compilerPath: require.resolve("solc/soljson.js"),
    isSolcJs: true,
    version: args.solcVersion,
    longVersion: solc.version().replace(".Emscripten.clang", ""),
  };
});

const accounts = process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    // Mezo's docs specify the london EVM target.
    settings: { evmVersion: "london", optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    mezotestnet: { url: "https://rpc.test.mezo.org", chainId: 31611, accounts },
  },
};
