import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { firstTag, firstTitle, firstUrl } from "../constants";
import { deployContractFixture } from "./fixtures";

describe("Deploy", function () {
    it("Should have one element in tags array", async function () {
      const { channel4Contract, owner } = await loadFixture(deployContractFixture);
      const allTags = await channel4Contract.getAllTags();
      const firstTagObject = allTags[0];

      expect( allTags.length ).to.equal(1);
      expect( firstTagObject.name ).to.equal(firstTag);
      expect( firstTagObject.createdBy ).to.equal(owner.address);
      expect( firstTagObject.contentIds.length).to.equal(1);
    });

    it("Should have one element in content array", async function () {
      const { channel4Contract, owner } = await loadFixture(deployContractFixture);
      const allContent = await channel4Contract.getAllContent();
      const firstContentObject = allContent[0];

      expect( allContent.length ).to.equal(1);
      expect( firstContentObject.title ).to.equal(firstTitle);
      expect( firstContentObject.url).to.equal(firstUrl);
      expect( firstContentObject.submittedBy ).to.equal(owner.address);
      expect( Number(firstContentObject.likes) ).to.equal(0);
      expect( firstContentObject.tagIds.length ).to.equal(1);
    });

    it("Should block creation functions from non-owner", async function () {
      const { channel4Contract, otherAccount1 } = await loadFixture(deployContractFixture);

      await expect(
        channel4Contract.connect(otherAccount1).createContentIfNotExists(
          firstTitle,
          firstUrl,
          otherAccount1.address,
          0,
          [firstTag]
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        channel4Contract.connect(otherAccount1).createTagIfNotExists(
          firstTag,
          otherAccount1.address,
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should block interaction functions from non-owner", async function () {
      const { channel4Contract, otherAccount1 } = await loadFixture(deployContractFixture);

      await expect(
        channel4Contract.connect(otherAccount1).likeContent(
          firstUrl,
          otherAccount1.address
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        channel4Contract.connect(otherAccount1).unlikeContent(
          firstUrl,
          otherAccount1.address
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });