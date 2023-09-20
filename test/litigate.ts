import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  prepareEIP712LitigateContentFixture,
  prepareEIP712LitigateLikeFixture,
  prepareEIP712LitigateTagFixture,
} from './fixtures';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { FIRST_TAG, SECOND_TAG, SLASHING_FEE } from '../constants';

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
      title: 'Google',
      url: 'https://google.com/',
      submittedBy: otherAccount1.address,
      likes: 0,
      tagIds: [FIRST_TAG, SECOND_TAG],
    };
    const EIPSignature = await backendWallet.signTypedData(
      domain,
      types,
      content,
    );

    const allContentBefore = await channel4Contract.getAllContent();
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
      title: 'Google',
      url: 'https://google.com/',
      submittedBy: otherAccount1.address,
      likes: 0,
      tagIds: [FIRST_TAG, SECOND_TAG],
    };
    const EIPSignature = await otherAccount1.signTypedData(
      domain,
      types,
      content,
    );

    await expect(
      channel4Contract
        .connect(otherAccount1)
        .litigateContent(content, EIPSignature),
    ).to.be.revertedWith('Invalid signature');
  });

  it('Should add a missing tag', async function () {
    const { channel4Contract, otherAccount1, domain, types, backendWallet } =
      await loadFixture(prepareEIP712LitigateTagFixture);
    const tag = {
      name: 'science',
      createdBy: otherAccount1.address,
    };
    const EIPSignature = await backendWallet.signTypedData(domain, types, tag);

    const allTagsBefore = await channel4Contract.getAllTags();
    const backendVaultBefore = await channel4Contract.backendVault();
    const contractBalanceBefore = await ethers.provider.getBalance(
      await channel4Contract.getAddress(),
    );

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
    };
    const EIPSignature = await backendWallet.signTypedData(domain, types, tag);

    const allTagsBefore = await channel4Contract.getAllTags();
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
    };
    const EIPSignature = await otherAccount1.signTypedData(domain, types, tag);

    await expect(
      channel4Contract.connect(otherAccount1).litigateTag(tag, EIPSignature),
    ).to.be.revertedWith('Invalid signature');
  });

  it('Should add missing likes', async function () {
    const { channel4Contract, otherAccount1, domain, types, backendWallet } =
      await loadFixture(prepareEIP712LitigateLikeFixture);
    const like = {
      submittedBy: otherAccount1.address,
      url: 'https://google.com/',
      liked: true,
      nonce: 2, // this is 2nd time the content is given a like. 1st was the backend wallet
    };
    const EIPSignature = await backendWallet.signTypedData(domain, types, like);

    const contentBefore = await channel4Contract.getContent(like.url);
    const backendVaultBefore = await channel4Contract.backendVault();
    const contractBalanceBefore = await ethers.provider.getBalance(
      await channel4Contract.getAddress(),
    );
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
    };
    const EIPSignature = await backendWallet.signTypedData(domain, types, like);

    const contentBefore = await channel4Contract.getContent(like.url);
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
    };
    const EIPSignature = await otherAccount1.signTypedData(domain, types, like);
    await expect(
      channel4Contract.connect(otherAccount1).litigateLike(like, EIPSignature),
    ).to.be.revertedWith('Invalid signature');
  });
});
