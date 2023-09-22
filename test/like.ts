import { expect } from 'chai';
import { likeContentFixture } from './fixtures';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('Like', async function () {
  it('Should successfully like a Content', async function () {
    const { channel4Contract, contentObj, otherAccount1 } =
      await loadFixture(likeContentFixture);

    const content = await channel4Contract.getContent(contentObj.url);
    expect(Number(content.likes)).to.equal(1);

    const userLikedContents = await channel4Contract.getUserLikedContent(
      otherAccount1.address,
    );
    expect(userLikedContents.length).to.equal(1);
    expect(Number(userLikedContents[0].likes)).to.equal(1);
  });

  it('Should successfully unlike a Content', async function () {
    const {
      channel4Contract,
      contentObj,
      otherAccount1,
      backendWallet,
      nonce,
    } = await loadFixture(likeContentFixture);

    await channel4Contract
      .connect(backendWallet)
      .toggleLike(contentObj.url, false, nonce + 1, otherAccount1.address);
    const content = await channel4Contract.getContent(contentObj.url);
    expect(Number(content.likes)).to.equal(0);

    const userLikedContents = await channel4Contract.getUserLikedContent(
      otherAccount1.address,
    );
    expect(userLikedContents.length).to.equal(0);
  });
});
