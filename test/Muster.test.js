const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, mine } = require("@nomicfoundation/hardhat-network-helpers");

const E = (n) => ethers.parseEther(String(n));
const Check = { TroveActive: 0, BalanceAtLeast: 1, Custom: 2 };
const DAY = 24 * 60 * 60;

describe("Muster", () => {
  let musd, savings, tm, check, muster;
  let creator, alice, bob, treasury, stranger;

  async function invariant() {
    expect(await savings.balanceOf(muster.target)).to.equal(await muster.escrowed());
  }

  async function deadlineIn(days) {
    return (await time.latest()) + days * DAY;
  }

  async function newQuest({ kind = Check.TroveActive, target = ethers.ZeroAddress, threshold = 0, reward = E(10), slots = 3, days = 7, title = "Open a MUSD loan", url = "https://mezo.org" } = {}) {
    const id = await muster.questCount();
    await muster.connect(creator).createQuest(kind, target, threshold, reward, slots, await deadlineIn(days), title, url);
    return id;
  }

  beforeEach(async () => {
    [creator, alice, bob, treasury, stranger] = await ethers.getSigners();
    musd = await (await ethers.getContractFactory("MockMUSD")).deploy();
    savings = await (await ethers.getContractFactory("MockSavings")).deploy(musd.target, musd.target);
    tm = await (await ethers.getContractFactory("MockTroveManager")).deploy();
    check = await (await ethers.getContractFactory("MockCheck")).deploy();
    muster = await (await ethers.getContractFactory("Muster")).deploy(musd.target, savings.target, tm.target, treasury.address);
    await musd.mint(creator.address, E(10_000));
    await musd.connect(creator).approve(muster.target, ethers.MaxUint256);
  });

  describe("createQuest", () => {
    it("parks the whole escrow in the savings vault", async () => {
      await newQuest({ reward: E(10), slots: 3 });
      expect(await muster.escrowed()).to.equal(E(30));
      expect(await musd.balanceOf(muster.target)).to.equal(0);
      expect(await savings.balanceOf(muster.target)).to.equal(E(30));
      await invariant();
    });

    it("rejects bad parameters", async () => {
      const d = await deadlineIn(7);
      const c = muster.connect(creator);
      await expect(c.createQuest(0, ethers.ZeroAddress, 0, 0, 3, d, "t", "")).to.be.revertedWithCustomError(muster, "BadParams");
      await expect(c.createQuest(0, ethers.ZeroAddress, 0, E(1), 0, d, "t", "")).to.be.revertedWithCustomError(muster, "BadParams");
      await expect(c.createQuest(0, ethers.ZeroAddress, 0, E(1), 1, 1, "t", "")).to.be.revertedWithCustomError(muster, "BadParams");
      await expect(c.createQuest(0, ethers.ZeroAddress, 0, E(1), 1, await deadlineIn(91), "t", "")).to.be.revertedWithCustomError(muster, "BadParams");
      // a check target must be a contract
      await expect(c.createQuest(Check.Custom, alice.address, 0, E(1), 1, d, "t", "")).to.be.revertedWithCustomError(muster, "BadParams");
      await expect(c.createQuest(Check.BalanceAtLeast, musd.target, 0, E(1), 1, d, "t", "")).to.be.revertedWithCustomError(muster, "BadParams");
      // a title is required and both strings are length-capped
      await expect(c.createQuest(0, ethers.ZeroAddress, 0, E(1), 1, d, "", "")).to.be.revertedWithCustomError(muster, "BadParams");
      await expect(c.createQuest(0, ethers.ZeroAddress, 0, E(1), 1, d, "x".repeat(81), "")).to.be.revertedWithCustomError(muster, "BadParams");
      await expect(c.createQuest(0, ethers.ZeroAddress, 0, E(1), 1, d, "t", "x".repeat(201))).to.be.revertedWithCustomError(muster, "BadParams");
    });

    it("refuses a vault that does not credit the full deposit", async () => {
      const bad = await (await ethers.getContractFactory("ShortSavings")).deploy(musd.target);
      const m2 = await (await ethers.getContractFactory("Muster")).deploy(musd.target, bad.target, tm.target, treasury.address);
      await musd.connect(creator).approve(m2.target, ethers.MaxUint256);
      await expect(m2.connect(creator).createQuest(0, ethers.ZeroAddress, 0, E(1), 1, await deadlineIn(1), "t", "")).to.be.revertedWithCustomError(m2, "SavingsMismatch");
    });
  });

  describe("join and claim", () => {
    it("pays a wallet that opened a trove after joining", async () => {
      const id = await newQuest();
      await muster.connect(alice).join(id);
      await tm.set(alice.address, 1);
      await expect(muster.connect(alice).claim(id)).to.emit(muster, "Claimed").withArgs(id, alice.address, E(10));
      expect(await musd.balanceOf(alice.address)).to.equal(E(10));
      expect(await muster.escrowed()).to.equal(E(20));
      await invariant();
    });

    it("will not let a wallet that already qualifies join", async () => {
      const id = await newQuest();
      await tm.set(alice.address, 1);
      await expect(muster.connect(alice).join(id)).to.be.revertedWithCustomError(muster, "AlreadyQualifies");
    });

    it("rejects claims without joining, without the action, or twice", async () => {
      const id = await newQuest();
      await expect(muster.connect(alice).claim(id)).to.be.revertedWithCustomError(muster, "NotJoined");
      await muster.connect(alice).join(id);
      await expect(muster.connect(alice).claim(id)).to.be.revertedWithCustomError(muster, "NotCompleted");
      // closed troves (status 2,3,4) do not count
      await tm.set(alice.address, 2);
      await expect(muster.connect(alice).claim(id)).to.be.revertedWithCustomError(muster, "NotCompleted");
      await tm.set(alice.address, 1);
      await muster.connect(alice).claim(id);
      await expect(muster.connect(alice).claim(id)).to.be.revertedWithCustomError(muster, "AlreadyClaimed");
      await expect(muster.connect(alice).join(id)).to.be.revertedWithCustomError(muster, "AlreadyJoined");
      await invariant();
    });

    it("rejects join and claim in the same block", async () => {
      const id = await newQuest({ kind: Check.Custom, target: check.target });
      await ethers.provider.send("evm_setAutomine", [false]);
      const n = await alice.getNonce();
      let j, s, c;
      try {
        j = await muster.connect(alice).join(id, { nonce: n, gasLimit: 300_000 });
        s = await check.set(alice.address, true, { gasLimit: 100_000 });
        c = await muster.connect(alice).claim(id, { nonce: n + 1, gasLimit: 300_000 });
        await mine();
      } finally {
        await ethers.provider.send("evm_setAutomine", [true]);
      }
      expect((await j.wait()).status).to.equal(1);
      expect((await s.wait()).status).to.equal(1);
      const receipt = await ethers.provider.getTransactionReceipt(c.hash);
      expect(receipt.status).to.equal(0);
      expect(await musd.balanceOf(alice.address)).to.equal(0);
    });

    it("stops paying when slots run out or the deadline passes", async () => {
      const id = await newQuest({ slots: 1, days: 2 });
      await muster.connect(alice).join(id);
      await muster.connect(bob).join(id);
      await tm.set(alice.address, 1);
      await tm.set(bob.address, 1);
      await muster.connect(alice).claim(id);
      await expect(muster.connect(bob).claim(id)).to.be.revertedWithCustomError(muster, "QuestOver");

      const id2 = await newQuest({ slots: 2, days: 1 });
      await tm.set(stranger.address, 0);
      await muster.connect(stranger).join(id2);
      await tm.set(stranger.address, 1);
      await time.increase(2 * DAY);
      await expect(muster.connect(stranger).claim(id2)).to.be.revertedWithCustomError(muster, "QuestOver");
      await invariant();
    });

    it("checks token balances (sMUSD, LP or NFT holdings)", async () => {
      const id = await newQuest({ kind: Check.BalanceAtLeast, target: savings.target, threshold: E(50) });
      await muster.connect(alice).join(id);
      await musd.mint(alice.address, E(50));
      await musd.connect(alice).approve(savings.target, E(50));
      await savings.connect(alice).deposit(E(49));
      await expect(muster.connect(alice).claim(id)).to.be.revertedWithCustomError(muster, "NotCompleted");
      await savings.connect(alice).deposit(E(1));
      await muster.connect(alice).claim(id);
      expect(await musd.balanceOf(alice.address)).to.equal(E(10));
      await invariant();
    });

    it("treats a reverting or gas-burning custom check as not completed", async () => {
      const id = await newQuest({ kind: Check.Custom, target: check.target });
      await muster.connect(alice).join(id);
      await check.set(alice.address, true);
      await check.setBroken(true);
      expect(await muster.completed(id, alice.address)).to.equal(false);
      await expect(muster.connect(alice).claim(id)).to.be.revertedWithCustomError(muster, "NotCompleted");
      await check.setBroken(false);
      await muster.connect(alice).claim(id);

      const hog = await (await ethers.getContractFactory("GasHogCheck")).deploy();
      const id2 = await newQuest({ kind: Check.Custom, target: hog.target });
      // join must still succeed cheaply: the check is capped at 200k gas
      const tx = await muster.connect(bob).join(id2);
      expect((await tx.wait()).gasUsed).to.be.lessThan(350_000n);
    });
  });

  describe("closeQuest", () => {
    it("refunds only unclaimed escrow, only to the creator, only after the deadline", async () => {
      const id = await newQuest({ reward: E(10), slots: 3, days: 3 });
      await muster.connect(alice).join(id);
      await tm.set(alice.address, 1);
      await muster.connect(alice).claim(id);

      await expect(muster.connect(creator).closeQuest(id)).to.be.revertedWithCustomError(muster, "QuestStillOpen");
      await time.increase(4 * DAY);
      await expect(muster.connect(alice).closeQuest(id)).to.be.revertedWithCustomError(muster, "NotCreator");

      const before = await musd.balanceOf(creator.address);
      await expect(muster.connect(creator).closeQuest(id)).to.emit(muster, "QuestClosed").withArgs(id, E(20));
      expect((await musd.balanceOf(creator.address)) - before).to.equal(E(20));
      await expect(muster.connect(creator).closeQuest(id)).to.be.revertedWithCustomError(muster, "QuestOver");
      expect(await muster.escrowed()).to.equal(0);
      await invariant();
    });
  });

  describe("sweep", () => {
    it("sends savings yield to the treasury and never touches escrow", async () => {
      const id = await newQuest({ reward: E(10), slots: 3 });
      await musd.mint(savings.target, E(7));
      await savings.accrue(muster.target, E(7));

      await expect(muster.connect(stranger).sweep(musd.target)).to.emit(muster, "Swept").withArgs(musd.target, E(7));
      expect(await musd.balanceOf(treasury.address)).to.equal(E(7));
      expect(await savings.balanceOf(muster.target)).to.equal(E(30));

      // sweeping the vault token itself moves nothing while it is all escrow
      await muster.sweep(savings.target);
      expect(await savings.balanceOf(treasury.address)).to.equal(0);

      // every slot is still fully payable
      for (const u of [alice, bob, stranger]) {
        await muster.connect(u).join(id);
        await tm.set(u.address, 1);
        await muster.connect(u).claim(id);
        expect(await musd.balanceOf(u.address)).to.equal(E(10));
      }
      await invariant();
    });

    it("keeps yield that arrives during a claim separate from the reward", async () => {
      const id = await newQuest({ reward: E(10), slots: 1 });
      await muster.connect(alice).join(id);
      await tm.set(alice.address, 1);
      await musd.mint(savings.target, E(3));
      await savings.accrue(muster.target, E(3));
      await muster.connect(alice).claim(id); // vault auto-claims 3 MUSD of yield to Muster
      expect(await musd.balanceOf(alice.address)).to.equal(E(10));
      expect(await musd.balanceOf(muster.target)).to.equal(E(3));
      await muster.sweep(musd.target);
      expect(await musd.balanceOf(treasury.address)).to.equal(E(3));
      await invariant();
    });

    it("only releases vault tokens above the escrowed amount", async () => {
      await newQuest({ reward: E(10), slots: 3 });
      await musd.mint(stranger.address, E(5));
      await musd.connect(stranger).approve(savings.target, E(5));
      await savings.connect(stranger).deposit(E(5));
      await savings.connect(stranger).transfer(muster.target, E(5)); // stray donation
      await muster.sweep(savings.target);
      expect(await savings.balanceOf(treasury.address)).to.equal(E(5));
      expect(await savings.balanceOf(muster.target)).to.equal(E(30));
      await invariant();
    });
  });

  it("holds the escrow invariant across a mixed sequence", async () => {
    const a = await newQuest({ reward: E(5), slots: 2, days: 1 });
    const b = await newQuest({ kind: Check.Custom, target: check.target, reward: E(8), slots: 2, days: 5 });
    await muster.connect(alice).join(a);
    await muster.connect(alice).join(b);
    await muster.connect(bob).join(b);
    await tm.set(alice.address, 1);
    await muster.connect(alice).claim(a);
    await invariant();
    await check.set(bob.address, true);
    await muster.connect(bob).claim(b);
    await invariant();
    await time.increase(2 * DAY);
    await muster.connect(creator).closeQuest(a);
    await invariant();
    await muster.sweep(musd.target);
    await invariant();
    expect(await muster.escrowed()).to.equal(E(8));
  });
});
