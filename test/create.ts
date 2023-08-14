import { expect } from "chai";
import { createContentIfNotExistsFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";


describe("Create", async function () {
    it("Should successfully submit Content", async function () {
      const { channel4Contract, contentObj } = await loadFixture(createContentIfNotExistsFixture);

      const allUrls = await channel4Contract.getAllContent();
      const allTags = await channel4Contract.getAllTags();
      const firstTagObject = allTags[0];
      expect( allUrls.length ).to.equal(2); // remember that a url is added in deploy and other in create
      expect( allTags.length ).to.equal(contentObj.tags.length); // keep in mind that firstTag is included

      const urlIdsInFirstTag = firstTagObject.contentIds;

      expect( urlIdsInFirstTag.length ).to.equal(1);
      expect( urlIdsInFirstTag[0] ).to.equal(allUrls.length); // check for url ids
    });

    it("Should have the correct URL object attributes", async function () {
      const { channel4Contract, otherAccount1, contentObj } = await loadFixture(createContentIfNotExistsFixture);

      const allUrls = await channel4Contract.getAllContent();
      const firstUrlObject = allUrls[0];

      expect( firstUrlObject.title ).to.equal(contentObj.title);
      expect( firstUrlObject.url ).to.equal(contentObj.url);
      expect( firstUrlObject.submittedBy ).to.equal(otherAccount1.address);
      expect( firstUrlObject.tagIds.length ).to.equal(contentObj.tags.length);
      // check tag ids are correct
      for (let i = 0, ni = contentObj.tags.length; i<ni; i++){
        expect( Number(firstUrlObject.tagIds[i]) ).to.equal(i);
      }
    });

    it("Should not add new tags if they already exist", async function () {
      const { channel4Contract, contentObj } = await loadFixture(createContentIfNotExistsFixture);

      const allTags = await channel4Contract.getAllTags();
      expect( allTags.length ).to.equal(contentObj.tags.length);
    });

  });