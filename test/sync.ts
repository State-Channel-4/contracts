import { expect } from "chai";
import { deployContractFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { contentToAdd, firstTag, firstTitle, firstUrl, tagsToAdd, usersToAdd } from "../constants";

describe("Sync", async function () {
  it("Should succesfully load a bunch of content to the contract state", async function () {
      const { channel4Contract, owner } = await loadFixture(deployContractFixture);
      await channel4Contract.syncState(
        [],
        [],
        contentToAdd
      );

      const allTags = await channel4Contract.getAllTags();
      const allContentInContract = await channel4Contract.getAllContent();
      const allContentInBackend = [{
        title: firstTitle,
        url: firstUrl,
        submittedBy: owner.address,
        likes: 0,
        tagIds: [firstTag],
      }].concat(contentToAdd)

      // check tags
      for (let i = 0, ni=allContentInContract.length; i < ni; i++) {
        expect(allContentInContract[i].title).to.equal(allContentInBackend[i].title);
        expect(allContentInContract[i].url).to.equal(allContentInBackend[i].url);
        expect(allContentInContract[i].submittedBy).to.equal(allContentInBackend[i].submittedBy);
        expect(Number(allContentInContract[i].likes)).to.equal(allContentInBackend[i].likes);

        const tagsInContract = allContentInContract[i].tagIds;
        const tagsInBackend = allContentInBackend[i].tagIds;
        tagsInContract.forEach((tagIndex, j) => {
          const tagNameInContract = allTags[Number(tagIndex)].name;
          const tagNameInBackend = tagsInBackend[j];
          expect(tagNameInContract).to.equal(tagNameInBackend);
        });
      }
    });

    it("Should succesfully load a bunch of tags to the contract state", async function () {
      const { channel4Contract, owner } = await loadFixture(deployContractFixture);
      await channel4Contract.syncState(
        [],
        tagsToAdd,
        []
      );

      const allContent = await channel4Contract.getAllContent();
      const allTags = await channel4Contract.getAllTags();
      const allTagsInBackend = [{
        name: firstTag,
        createdBy: owner.address,
        contentIds: [firstUrl],
      }].concat(tagsToAdd);

      for (let i = 0, ni=allTags.length; i < ni; i++) {
        expect(allTags[i].name).to.equal(allTagsInBackend[i].name);
        expect(allTags[i].createdBy).to.equal(allTagsInBackend[i].createdBy);

        // check contents
        const contentIdsInContract = allTags[i].contentIds;
        const contentIdsInBackend = allTagsInBackend[i].contentIds;
        contentIdsInContract.forEach((contentIndex, j) => {
          const contentUrlInContract = allContent[Number(contentIndex)].url;
          const contentUrlInBackend = contentIdsInBackend[j];
          expect(contentUrlInContract).to.equal(contentUrlInBackend);
        });
      }
    });

    it("Should succesfully load a bunch of users to the contract state", async function () {
      const { channel4Contract, owner } = await loadFixture(deployContractFixture);
      await channel4Contract.syncState(
        usersToAdd,
        [],
        []
      );

      const allUsersInContract = await channel4Contract.getAllUsers();
      const allUsersInBackend = [{
        userAddress: owner.address,
        numberOfLikedContent: 0,
        submittedContent: [0],
      }].concat(usersToAdd);

      for (let i = 0, ni = allUsersInContract.length; i < ni; i++) {
        expect(allUsersInContract[i].userAddress).to.equal(allUsersInBackend[i].userAddress);
        expect(allUsersInContract[i].numberOfLikedContent).to.equal(allUsersInBackend[i].numberOfLikedContent);

        const submittedContentInContract = allUsersInContract[i].submittedContent;
        const submittedContentInBackend = allUsersInBackend[i].submittedContent;
        submittedContentInContract.forEach((contentIndex, j) => {
          expect(Number(contentIndex)).to.equal(submittedContentInBackend[j]);
        });
      }
    });
});