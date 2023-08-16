import { expect } from "chai";
import { deployContractFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { contentToAdd, tagsToAdd, usersToAdd } from "../constants";

describe("Sync", async function () {
  it("Should succesfully load a bunch of content to the contract state", async function () {
      const { channel4Contract } = await loadFixture(deployContractFixture);
      await channel4Contract.syncState(
        usersToAdd,
        tagsToAdd,
        contentToAdd
      );

      const allContent = await channel4Contract.getAllContent();
      console.log(allContent);

      // TODO: how to measure success?

    });
});