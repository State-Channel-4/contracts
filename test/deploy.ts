import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import {
  CONTENT_TO_ADD,
  FIRST_TAG,
  FIRST_TITLE,
  FIRST_URL,
  TAGS_TO_ADD,
  USERS_TO_ADD,
} from '../constants';
import { deployContractFixture } from './fixtures';

describe('Deploy', function () {
  it('Should have one element in tags array', async function () {
    const { channel4Contract, deployer } = await loadFixture(
      deployContractFixture,
    );
    const allTags = await channel4Contract.getAllTags();
    const firstTagObject = allTags[0];

    expect(allTags.length).to.equal(1);
    expect(firstTagObject.name).to.equal(FIRST_TAG);
    expect(firstTagObject.createdBy).to.equal(deployer.address);
    expect(firstTagObject.contentIds.length).to.equal(1);
  });

  it('Should have one element in content array', async function () {
    const { channel4Contract, deployer } = await loadFixture(
      deployContractFixture,
    );
    const allContent = await channel4Contract.getAllContent();
    const firstContentObject = allContent[0];

    expect(allContent.length).to.equal(1);
    expect(firstContentObject.title).to.equal(FIRST_TITLE);
    expect(firstContentObject.url).to.equal(FIRST_URL);
    expect(firstContentObject.submittedBy).to.equal(deployer.address);
    expect(Number(firstContentObject.likes)).to.equal(0);
    expect(firstContentObject.tagIds.length).to.equal(1);
  });

  it('Should block creation functions from non-backend', async function () {
    const { channel4Contract, otherAccount1 } = await loadFixture(
      deployContractFixture,
    );

    await expect(
      channel4Contract
        .connect(otherAccount1)
        .createContentIfNotExists(
          FIRST_TITLE,
          FIRST_URL,
          otherAccount1.address,
          0,
          [FIRST_TAG],
        ),
    ).to.be.revertedWith('Caller is not the backend');

    await expect(
      channel4Contract
        .connect(otherAccount1)
        .createTagIfNotExists(FIRST_TAG, otherAccount1.address),
    ).to.be.revertedWith('Caller is not the backend');

    await expect(
      channel4Contract
        .connect(otherAccount1)
        .createUserIfNotExists(otherAccount1.address),
    ).to.be.revertedWith('Caller is not the backend');

    await expect(
      channel4Contract
        .connect(otherAccount1)
        .syncState(USERS_TO_ADD, TAGS_TO_ADD, CONTENT_TO_ADD, []),
    ).to.be.revertedWith('Caller is not the backend');
  });

  it('Should not expose creation functions to the outside', async function () {
    const { channel4Contract } = await loadFixture(deployContractFixture);

    expect(channel4Contract).to.not.have.property('_createContentIfNotExists');
    expect(channel4Contract).to.not.have.property('_createTagIfNotExists');
    expect(channel4Contract).to.not.have.property('_createUserIfNotExists');
  });

  it('Should block interaction functions from non-backend', async function () {
    const { channel4Contract, otherAccount1 } = await loadFixture(
      deployContractFixture,
    );

    await expect(
      channel4Contract
        .connect(otherAccount1)
        .toggleLike(FIRST_URL, true, otherAccount1.address),
    ).to.be.revertedWith('Caller is not the backend');

    await expect(
      channel4Contract
        .connect(otherAccount1)
        .toggleLike(FIRST_URL, true, otherAccount1.address),
    ).to.be.revertedWith('Caller is not the backend');
  });
});
