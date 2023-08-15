import { expect } from "chai";
import { createContentIfNotExistsFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { firstTag, secondTag } from "../constants";


describe("Create", async function () {
    it("Should successfully submit Content", async function () {
      const { channel4Contract, contentObj, owner, otherAccount1 } = await loadFixture(createContentIfNotExistsFixture);

      const allContent = await channel4Contract.getAllContent();
      const allTags = await channel4Contract.getAllTags();

      expect( allContent.length ).to.equal(2); // remember that a content is added in deploy and other in create
      expect( allTags.length ).to.equal(contentObj.tags.length); // remember that firstTag is included in content.tags

      const content = await channel4Contract.getContent(contentObj.url);

      expect( content.title ).to.equal(contentObj.title);
      expect( content.url ).to.equal(contentObj.url);
      expect( content.submittedBy ).to.equal(contentObj.submittedBy);
      expect( Number(content.likes) ).to.equal(0);
      expect( content.tagIds.length ).to.equal(contentObj.tags.length);

      content.tagIds.forEach( (tag) => {
        const tagObj = allTags[Number(tag)];
        expect([firstTag, secondTag]).to.include(tagObj.name);
        expect([owner.address, otherAccount1.address]).to.include(tagObj.createdBy);
        expect( tagObj.contentIds.length ).to.greaterThanOrEqual(0);
        expect( tagObj.contentIds.length ).to.lessThanOrEqual(2);
      });
    });

    it("Should not add new tags if they already exist", async function () {
      const { channel4Contract, contentObj, owner } = await loadFixture(createContentIfNotExistsFixture);
      await channel4Contract.createTagIfNotExists(firstTag, owner.address);
      const allTags = await channel4Contract.getAllTags();
      expect( allTags.length ).to.equal(contentObj.tags.length);
    });

  });