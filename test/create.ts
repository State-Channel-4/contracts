import { expect } from "chai";
import { createContentIfNotExistsFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";


describe("Create", async function () {
    it("Should successfully submit Content", async function () {
      const { channel4Contract, contentObj } = await loadFixture(createContentIfNotExistsFixture);

      const allContent = await channel4Contract.getAllContent();
      const allTags = await channel4Contract.getAllTags();
      const firstTagObject = allTags[0];
      expect( allContent.length ).to.equal(2); // remember that a url is added in deploy and other in create
      expect( allTags.length ).to.equal(contentObj.tags.length); // keep in mind that firstTag is included

      const contentIdsInFirstTag = firstTagObject.contentIds;

      expect( contentIdsInFirstTag.length ).to.equal(1);
      expect( contentIdsInFirstTag[0] ).to.equal(allContent.length); // check for url ids
    });

    it("Should have the correct URL object attributes", async function () {
      const { channel4Contract, otherAccount1, contentObj } = await loadFixture(createContentIfNotExistsFixture);

      const allContent = await channel4Contract.getAllContent();
      const firstContentObject = allContent[0];

      expect( firstContentObject.title ).to.equal(contentObj.title);
      expect( firstContentObject.url ).to.equal(contentObj.url);
      expect( firstContentObject.submittedBy ).to.equal(otherAccount1.address);
      expect( firstContentObject.tagIds.length ).to.equal(contentObj.tags.length);
      // check tag ids are correct
      for (let i = 0, ni = contentObj.tags.length; i<ni; i++){
        expect( Number(firstContentObject.tagIds[i]) ).to.equal(i);
      }
    });

    it("Should not add new tags if they already exist", async function () {
      const { channel4Contract, contentObj } = await loadFixture(createContentIfNotExistsFixture);

      const allTags = await channel4Contract.getAllTags();
      expect( allTags.length ).to.equal(contentObj.tags.length);
    });

  });