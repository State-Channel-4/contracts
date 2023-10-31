import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  likeContentFixture,
  prepareEIP712LitigateContentFixture,
  prepareEIP712LitigateLikeFixture,
  prepareEIP712LitigateTagFixture,
} from './fixtures';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import {
  FIRST_TAG,
  SECOND_TAG,
  SECOND_TITLE,
  SECOND_URL,
  SLASHING_FEE,
  TIME_THRESHOLD,
} from '../constants';

describe('Litigate', async function () {
  it('Should add a missing content', async function () {
    const { channel4Contract, otherAccount1, domain, types, backendWallet } =
      await loadFixture(prepareEIP712LitigateContentFixture);
    const content = {
      title: 'Batman',
      url: 'https://www.dc.com/characters/batman',
      submittedBy: otherAccount1.address,
      likes: 0,
      tagIds: ['superhero'],
      timestamp: Math.floor(Date.now() / 1000),
    };
    const EIPSignature = await backendWallet.signTypedData(
      domain,
      types,
      content,
    );

    const allContentBefore = await channel4Contract.getAllContent();
    const contractBalanceBefore = await ethers.provider.getBalance(
      await channel4Contract.getAddress(),
    );
    const backendVaultBefore = await channel4Contract.backendVault();

    await time.increase(TIME_THRESHOLD + BigInt(5));
    await channel4Contract
      .connect(otherAccount1)
      .litigateContent(content, EIPSignature);

    const allContentAfter = await channel4Contract.getAllContent();
    const contractBalanceAfter = await ethers.provider.getBalance(
      await channel4Contract.getAddress(),
    );
    const backendVaultAfter = await channel4Contract.backendVault();
    const allTags = await channel4Contract.getAllTags();
    const lengthBefore = allContentBefore.length;
    const lengthAfter = allContentAfter.length;

    expect(lengthAfter).to.equal(lengthBefore + 1);
    expect(allContentAfter[lengthAfter - 1].title).to.equal(content.title);
    expect(allContentAfter[lengthAfter - 1].url).to.equal(content.url);
    expect(allContentAfter[lengthAfter - 1].submittedBy).to.equal(
      content.submittedBy,
    );
    expect(allContentAfter[lengthAfter - 1].likes).to.equal(content.likes);
    const tagIds = allContentAfter[lengthAfter - 1].tagIds;
    for (let i = 0, ni = tagIds.length; i < ni; i++) {
      const tagId = Number(tagIds[i]);
      const tag = allTags[tagId];
      expect(content.tagIds[i]).to.include(tag.name);
    }
    // slashing checks
    expect(contractBalanceAfter).to.equal(contractBalanceBefore - SLASHING_FEE);
    expect(backendVaultAfter).to.equal(backendVaultBefore - SLASHING_FEE);
  });

  it('Should prevent litigation in correct content', async function () {
    const { channel4Contract, otherAccount1, domain, types, backendWallet } =
      await loadFixture(prepareEIP712LitigateContentFixture);
    const content = {
      title: SECOND_TITLE,
      url: SECOND_URL,
      submittedBy: otherAccount1.address,
      likes: 0,
      tagIds: [FIRST_TAG, SECOND_TAG],
      timestamp: Math.floor(Date.now() / 1000),
    };
    const EIPSignature = await backendWallet.signTypedData(
      domain,
      types,
      content,
    );

    const allContentBefore = await channel4Contract.getAllContent();
    await time.increase(TIME_THRESHOLD + BigInt(5));
    await channel4Contract
      .connect(otherAccount1)
      .litigateContent(content, EIPSignature);
    const allContentAfter = await channel4Contract.getAllContent();
    expect(allContentAfter.length).to.equal(allContentBefore.length);
  });

  it('Should prevent litigation in content with wrong signature', async function () {
    const { channel4Contract, otherAccount1, domain, types } =
      await loadFixture(prepareEIP712LitigateContentFixture);
    const content = {
      title: SECOND_TITLE,
      url: SECOND_URL,
      submittedBy: otherAccount1.address,
      likes: 0,
      tagIds: [FIRST_TAG, SECOND_TAG],
      timestamp: Math.floor(Date.now() / 1000),
    };
    const EIPSignature = await otherAccount1.signTypedData(
      domain,
      types,
      content,
    );

    await time.increase(TIME_THRESHOLD + BigInt(5));
    await expect(
      channel4Contract
        .connect(otherAccount1)
        .litigateContent(content, EIPSignature),
    ).to.be.revertedWith('Invalid signature');
  });

  it('Should prevent content litigation before time threshold', async function () {
    const { channel4Contract, otherAccount1, domain, types, backendWallet } =
      await loadFixture(prepareEIP712LitigateContentFixture);
    const content = {
      title: SECOND_TITLE,
      url: SECOND_URL,
      submittedBy: otherAccount1.address,
      likes: 0,
      tagIds: [FIRST_TAG, SECOND_TAG],
      timestamp: Math.floor(Date.now() / 1000),
    };
    const EIPSignature = await backendWallet.signTypedData(
      domain,
      types,
      content,
    );

    await time.increase(BigInt(1));
    await expect(
      channel4Contract
        .connect(otherAccount1)
        .litigateContent(content, EIPSignature),
    ).to.be.revertedWith('Time threshold has not passed yet');
  });

  it('Should add a missing tag', async function () {
    const { channel4Contract, otherAccount1, domain, types, backendWallet } =
      await loadFixture(prepareEIP712LitigateTagFixture);
    const tag = {
      name: 'science',
      createdBy: otherAccount1.address,
      timestamp: Math.floor(Date.now() / 1000),
    };
    const EIPSignature = await backendWallet.signTypedData(domain, types, tag);

    const allTagsBefore = await channel4Contract.getAllTags();
    const backendVaultBefore = await channel4Contract.backendVault();
    const contractBalanceBefore = await ethers.provider.getBalance(
      await channel4Contract.getAddress(),
    );

    await time.increase(TIME_THRESHOLD + BigInt(5));
    await channel4Contract
      .connect(otherAccount1)
      .litigateTag(tag, EIPSignature);

    const allTagsAfter = await channel4Contract.getAllTags();
    const backendVaultAfter = await channel4Contract.backendVault();
    const contractBalanceAfter = await ethers.provider.getBalance(
      await channel4Contract.getAddress(),
    );

    expect(allTagsAfter[allTagsAfter.length - 1].name).to.equal(tag.name);
    expect(allTagsAfter[allTagsAfter.length - 1].createdBy).to.equal(
      tag.createdBy,
    );
    expect(allTagsAfter.length).to.equal(allTagsBefore.length + 1);
    // slashing checks
    expect(contractBalanceAfter).to.equal(contractBalanceBefore - SLASHING_FEE);
    expect(backendVaultAfter).to.equal(backendVaultBefore - SLASHING_FEE);
  });

  it('Should prevent litigation in correct tag', async function () {
    const { channel4Contract, otherAccount1, domain, types, backendWallet } =
      await loadFixture(prepareEIP712LitigateTagFixture);
    const tag = {
      name: SECOND_TAG,
      createdBy: otherAccount1.address,
      timestamp: Math.floor(Date.now() / 1000),
    };
    const EIPSignature = await backendWallet.signTypedData(domain, types, tag);

    const allTagsBefore = await channel4Contract.getAllTags();
    await time.increase(TIME_THRESHOLD + BigInt(5));
    await channel4Contract
      .connect(otherAccount1)
      .litigateTag(tag, EIPSignature);
    const allTagsAfter = await channel4Contract.getAllTags();
    expect(allTagsAfter.length).to.equal(allTagsBefore.length);
  });

  it('Should prevent litigation in tag with wrong signature', async function () {
    const { channel4Contract, otherAccount1, domain, types } =
      await loadFixture(prepareEIP712LitigateTagFixture);
    const tag = {
      name: 'science',
      createdBy: otherAccount1.address, // check createContentIfNotExistsFixture
      timestamp: Math.floor(Date.now() / 1000),
    };
    const EIPSignature = await otherAccount1.signTypedData(domain, types, tag);
    await time.increase(TIME_THRESHOLD + BigInt(5));
    await expect(
      channel4Contract.connect(otherAccount1).litigateTag(tag, EIPSignature),
    ).to.be.revertedWith('Invalid signature');
  });

  it('Should prevent tag litigation before time threshold', async function () {
    const { channel4Contract, otherAccount1, domain, types } =
      await loadFixture(prepareEIP712LitigateTagFixture);
    const tag = {
      name: 'science',
      createdBy: otherAccount1.address, // check createContentIfNotExistsFixture
      timestamp: Math.floor(Date.now() / 1000),
    };
    const EIPSignature = await otherAccount1.signTypedData(domain, types, tag);
    await time.increase(BigInt(1));
    await expect(
      channel4Contract.connect(otherAccount1).litigateTag(tag, EIPSignature),
    ).to.be.revertedWith('Time threshold has not passed yet');
  });

  it('Should add missing likes', async function () {
    const { channel4Contract, otherAccount1, domain, types, backendWallet } =
      await loadFixture(prepareEIP712LitigateLikeFixture);
    const like = {
      submittedBy: otherAccount1.address,
      url: 'https://google.com/',
      liked: true,
      nonce: 2, // this is 2nd time the content is given a like. 1st was the backend wallet
      timestamp: Math.floor(Date.now() / 1000),
    };
    const EIPSignature = await backendWallet.signTypedData(domain, types, like);

    const contentBefore = await channel4Contract.getContent(like.url);
    const backendVaultBefore = await channel4Contract.backendVault();
    const contractBalanceBefore = await ethers.provider.getBalance(
      await channel4Contract.getAddress(),
    );
    await time.increase(TIME_THRESHOLD + BigInt(5));
    await channel4Contract
      .connect(otherAccount1)
      .litigateLike(like, EIPSignature);
    const contentAfter = await channel4Contract.getContent(like.url);
    const backendVaultAfter = await channel4Contract.backendVault();
    const contractBalanceAfter = await ethers.provider.getBalance(
      await channel4Contract.getAddress(),
    );

    expect(Number(contentAfter.likes)).to.equal(
      Number(contentBefore.likes) + 1,
    );
    // slashing checks
    expect(contractBalanceAfter).to.equal(contractBalanceBefore - SLASHING_FEE);
    expect(backendVaultAfter).to.equal(backendVaultBefore - SLASHING_FEE);
  });

  it('Should prevent litigation in correct likes', async function () {
    const { channel4Contract, otherAccount1, domain, types, backendWallet } =
      await loadFixture(prepareEIP712LitigateLikeFixture);
    const like = {
      submittedBy: backendWallet.address,
      url: 'https://google.com/',
      liked: true,
      nonce: 1, // this is 2nd time the content is given a like. 1st was the backend wallet
      timestamp: Math.floor(Date.now() / 1000),
    };
    const EIPSignature = await backendWallet.signTypedData(domain, types, like);

    const contentBefore = await channel4Contract.getContent(like.url);
    await time.increase(TIME_THRESHOLD + BigInt(5));
    await channel4Contract
      .connect(otherAccount1)
      .litigateLike(like, EIPSignature);
    const contentAfter = await channel4Contract.getContent(like.url);
    expect(Number(contentAfter.likes)).to.equal(Number(contentBefore.likes));
  });

  it('Should prevent litigation in likes with wrong signature', async function () {
    const { channel4Contract, otherAccount1, domain, types } =
      await loadFixture(prepareEIP712LitigateLikeFixture);
    const like = {
      submittedBy: otherAccount1.address,
      url: 'https://google.com/',
      liked: true,
      nonce: 2, // this is 2nd time the content is given a like. 1st was the backend wallet
      timestamp: Math.floor(Date.now() / 1000),
    };
    const EIPSignature = await otherAccount1.signTypedData(domain, types, like);
    await time.increase(TIME_THRESHOLD + BigInt(5));
    await expect(
      channel4Contract.connect(otherAccount1).litigateLike(like, EIPSignature),
    ).to.be.revertedWith('Invalid signature');
  });

  it('Should prevent like litigation before time threshold', async function () {
    const { channel4Contract, otherAccount1, domain, types } =
      await loadFixture(prepareEIP712LitigateLikeFixture);
    const like = {
      submittedBy: otherAccount1.address,
      url: 'https://google.com/',
      liked: true,
      nonce: 2, // this is 2nd time the content is given a like. 1st was the backend wallet
      timestamp: Math.floor(Date.now() / 1000),
    };
    const EIPSignature = await otherAccount1.signTypedData(domain, types, like);
    await time.increase(BigInt(1));
    await expect(
      channel4Contract.connect(otherAccount1).litigateLike(like, EIPSignature),
    ).to.be.revertedWith('Time threshold has not passed yet');
  });

  it('Should update the number of likes and slash backend if number of likes do not match', async function () {
    const { channel4Contract, contentObj, otherAccount1, backendWallet } =
      await loadFixture(likeContentFixture);
    // sync incorrect number of likes
    const content = {
      title: contentObj.title,
      url: contentObj.url,
      submittedBy: contentObj.submittedBy,
      likes: 4,
      tagIds: contentObj.tags,
    };
    await channel4Contract.connect(backendWallet).syncState([], [], [content]);
    // run litigate number of likes
    const backendVaultBefore = await channel4Contract.backendVault();
    await channel4Contract
      .connect(otherAccount1)
      .litigateNumberOfLikes(contentObj.url);
    const backendVaultAfter = await channel4Contract.backendVault();
    const contentAfter = await channel4Contract.getContent(contentObj.url);

    expect(Number(contentAfter.likes)).to.equal(1);
    expect(backendVaultAfter).to.equal(backendVaultBefore - SLASHING_FEE);
  });

  it('Should prevent update of number of likes of a specific content if it does match', async function () {
    const { channel4Contract, contentObj, otherAccount1 } =
      await loadFixture(likeContentFixture);

    const backendVaultBefore = await channel4Contract.backendVault();
    const contentBefore = await channel4Contract.getContent(contentObj.url);
    await channel4Contract
      .connect(otherAccount1)
      .litigateNumberOfLikes(contentObj.url);
    const contentAfter = await channel4Contract.getContent(contentObj.url);
    const backendVaultAfter = await channel4Contract.backendVault();

    expect(contentAfter.likes).to.equal(contentBefore.likes);
    expect(backendVaultAfter).to.equal(backendVaultBefore);
  });
});
