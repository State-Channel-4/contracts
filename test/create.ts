import { expect } from 'chai';
import {
  createContentIfNotExistsFixture,
  deployContractFixture,
} from './fixtures';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { FIRST_TAG, SECOND_TAG } from '../constants';

describe('Create', async function () {
  it('Should successfully submit Content', async function () {
    const { channel4Contract, contentObj } = await loadFixture(
      createContentIfNotExistsFixture,
    );

    const allContent = await channel4Contract.getAllContent();
    const allTags = await channel4Contract.getAllTags();
    const allUsers = await channel4Contract.getAllUsers();

    expect(allContent.length).to.equal(2); // remember that a content is added in deploy and other in create
    expect(allTags.length).to.equal(contentObj.tags.length); // remember that FIRST_TAG is included in content.tags
    expect(allUsers.length).to.equal(2); // remember that owner is included in deploy
  });

  it('Should have the corrent content object', async function () {
    const { channel4Contract, contentObj } = await loadFixture(
      createContentIfNotExistsFixture,
    );
    const content = await channel4Contract.getContent(contentObj.url);

    expect(content.title).to.equal(contentObj.title);
    expect(content.url).to.equal(contentObj.url);
    expect(content.submittedBy).to.equal(contentObj.submittedBy);
    expect(Number(content.likes)).to.equal(0);
    expect(content.tagIds.length).to.equal(contentObj.tags.length);
  });

  it('Should have the correct tag list', async function () {
    const {
      channel4Contract,
      contentObj,
      owner,
      otherAccount1,
      otherAccount2,
    } = await loadFixture(createContentIfNotExistsFixture);
    const allTags = await channel4Contract.getAllTags();
    const content = await channel4Contract.getContent(contentObj.url);

    content.tagIds.forEach((tag) => {
      const tagObj = allTags[Number(tag)];
      expect([FIRST_TAG, SECOND_TAG]).to.include(tagObj.name);
      expect([
        owner.address,
        otherAccount1.address,
        otherAccount2.address,
      ]).to.include(tagObj.createdBy);
      expect(tagObj.contentIds.length).to.greaterThanOrEqual(0);
      expect(tagObj.contentIds.length).to.lessThanOrEqual(2);
    });
  });

  it('Should have the correct user list', async function () {
    const { channel4Contract, owner, otherAccount1, otherAccount2 } =
      await loadFixture(createContentIfNotExistsFixture);
    const allUsers = await channel4Contract.getAllUsers();

    allUsers.forEach((user) => {
      expect([
        owner.address,
        otherAccount1.address,
        otherAccount2.address,
      ]).to.include(user.userAddress);
      expect(Number(user.numberOfLikedContent)).to.equal(0);
      expect(user.submittedContent.length).to.greaterThanOrEqual(0);
      expect(user.submittedContent.length).to.lessThanOrEqual(2);
      expect(user.submittedContent).to.contain.oneOf([BigInt(0), BigInt(1)]);
    });
  });

  it('Should not add new tags if they already exist', async function () {
    const { channel4Contract, contentObj, owner } = await loadFixture(
      createContentIfNotExistsFixture,
    );
    await channel4Contract.createTagIfNotExists(FIRST_TAG, owner.address);
    const allTags = await channel4Contract.getAllTags();
    expect(allTags.length).to.equal(contentObj.tags.length);
  });

  it("Should add new user if it doesn't exist", async function () {
    const { channel4Contract, otherAccount1 } = await loadFixture(
      deployContractFixture,
    );
    await channel4Contract.createUserIfNotExists(otherAccount1.address);
    const allUsers = await channel4Contract.getAllUsers();
    expect(allUsers.length).to.equal(2);
  });

  it('Should not add user if it exists', async function () {
    const { channel4Contract, owner } = await loadFixture(
      deployContractFixture,
    );
    await channel4Contract.createUserIfNotExists(owner.address);
    const allUsers = await channel4Contract.getAllUsers();
    expect(allUsers.length).to.equal(1);
  });
});
