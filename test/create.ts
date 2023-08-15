import { expect } from "chai";
import { createContentIfNotExistsFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { firstTag, secondTag } from "../constants";


describe("Create", async function () {
    it("Should successfully submit Content", async function () {
      const { channel4Contract, contentObj } = await loadFixture(createContentIfNotExistsFixture);

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
        console.log(tagObj)
        expect([firstTag, secondTag]).to.include(tagObj.name);
        //expect( tagObj.contentIds.length ).to.equal(1);
      });
    });

    /*
    it("Should have the correct Content object attributes", async function () {
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
    */

  });