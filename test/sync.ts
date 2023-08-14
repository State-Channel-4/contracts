import { expect } from "chai";
import { deployContractFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Sync", async function () {
    it("Should succesfully load a bunch of content to the contract state", async function () {
      const { channel4Contract, owner, otherAccount1 } = await loadFixture(deployContractFixture);

      await expect(
        channel4Contract.connect(owner).syncState()
      ).not.to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        channel4Contract.connect(otherAccount1).syncState()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
});