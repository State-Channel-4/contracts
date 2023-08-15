import { expect } from "chai";
import { deployContractFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Sync", async function () {
    it("Should succesfully load a bunch of content to the contract state", async function () {
      const { channel4Contract } = await loadFixture(deployContractFixture);

      await expect(
        channel4Contract.syncState()
      ).not.to.be.revertedWith("Ownable: caller is not the owner");
    });
});