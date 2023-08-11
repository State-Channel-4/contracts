import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { firstTag } from "../constants";
import { deployContractFixture } from "./fixtures";

describe("Deploy", function () {
    it("Should have one element in tags array", async function () {
      const { channel4Contract, owner } = await loadFixture(deployContractFixture);
      const allTags = await channel4Contract.getAllTags();
      const firstTagObject = allTags[0];

      expect( allTags.length ).to.equal(1);
      expect( firstTagObject.name ).to.equal(firstTag);
      expect( firstTagObject.createdBy ).to.equal(owner.address);
      expect( firstTagObject.contentIds.length).to.equal(0);
    });

    /*it("Should have no elements in urls array", async function () {
      const { urlContract } = await loadFixture(deployUrlContractFixture);
      const allUrls = await urlContract.getAllURLs();

      expect( allUrls.length ).to.equal(0);
    });*/
  });