import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployContractFixture } from './fixtures';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import {
  CONTENT_TO_ADD,
  FIRST_TAG,
  FIRST_TITLE,
  FIRST_URL,
  TAGS_TO_ADD,
  USERS_TO_ADD,
  USER_PUBLIC_ADDRESS,
} from '../constants';

describe('Sync', async function () {
  it('Should succesfully load a bunch of content to the contract state', async function () {
    const { channel4Contract, deployer, backendWallet } = await loadFixture(
      deployContractFixture,
    );
    await channel4Contract
      .connect(backendWallet)
      .syncState([], [], CONTENT_TO_ADD, []);

    const allTags = await channel4Contract.getAllTags();
    const allContentInContract = await channel4Contract.getAllContent();
    const allContentInBackend = [
      {
        title: FIRST_TITLE,
        url: FIRST_URL,
        submittedBy: deployer.address,
        likes: 0,
        tagIds: [FIRST_TAG],
      },
    ].concat(CONTENT_TO_ADD);

    // check tags
    for (let i = 0, ni = allContentInContract.length; i < ni; i++) {
      expect(allContentInContract[i].title).to.equal(
        allContentInBackend[i].title,
      );
      expect(allContentInContract[i].url).to.equal(allContentInBackend[i].url);
      expect(allContentInContract[i].submittedBy).to.equal(
        allContentInBackend[i].submittedBy,
      );
      expect(Number(allContentInContract[i].likes)).to.equal(
        allContentInBackend[i].likes,
      );

      const tagsInContract = allContentInContract[i].tagIds;
      const tagsInBackend = allContentInBackend[i].tagIds;
      tagsInContract.forEach((tagIndex, j) => {
        const tagNameInContract = allTags[Number(tagIndex)].name;
        const tagNameInBackend = tagsInBackend[j];
        expect(tagNameInContract).to.equal(tagNameInBackend);
      });
    }
  });

  it('Should succesfully load a bunch of tags to the contract state', async function () {
    const { channel4Contract, deployer, backendWallet } = await loadFixture(
      deployContractFixture,
    );
    await channel4Contract
      .connect(backendWallet)
      .syncState([], TAGS_TO_ADD, [], []);

    const allContent = await channel4Contract.getAllContent();
    const allTags = await channel4Contract.getAllTags();
    const allTagsInBackend = [
      {
        name: FIRST_TAG,
        createdBy: deployer.address,
        contentIds: [FIRST_URL],
      },
    ].concat(TAGS_TO_ADD);

    for (let i = 0, ni = allTags.length; i < ni; i++) {
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

  it('Should succesfully load a bunch of users to the contract state', async function () {
    const { channel4Contract, deployer, backendWallet } = await loadFixture(
      deployContractFixture,
    );
    await channel4Contract
      .connect(backendWallet)
      .syncState(USERS_TO_ADD, [], [], []);

    const allUsersInContract = await channel4Contract.getAllUsers();
    const allUsersInBackend = [deployer.address, ...USERS_TO_ADD];

    for (let i = 0, ni = allUsersInContract.length; i < ni; i++) {
      expect(allUsersInContract[i].userAddress).to.equal(allUsersInBackend[i]);
    }
  });

  it('Should succesfully load a bunch of likes to the contract state', async function () {
    // load deployed contract fixture
    const { channel4Contract, backendWallet } = await loadFixture(
      deployContractFixture,
    );

    // load accounts for test
    const [deployer, alice, bob] = await ethers.getSigners();
    const usersToAdd = [USER_PUBLIC_ADDRESS, alice.address, bob.address];
    const allUsers = [deployer.address, ...usersToAdd];

    // build likes
    const pendingActions = [
      {
        submittedBy: usersToAdd[0],
        url: CONTENT_TO_ADD[0].url,
        liked: true,
        nonce: 1,
      },
      {
        submittedBy: usersToAdd[1],
        url: CONTENT_TO_ADD[0].url,
        liked: true,
        nonce: 1,
      },
    ];

    // sync state
    await channel4Contract
      .connect(backendWallet)
      .syncState(usersToAdd, TAGS_TO_ADD, CONTENT_TO_ADD, pendingActions);

    // check for existence of users with expected likes
    const expectedLikes = [0, 1, 1, 0];
    const contractUsers = await channel4Contract.getAllUsers();
    for (let i = 0; i < contractUsers.length; i++) {
      // check for expected address
      expect(contractUsers[i].userAddress).to.equal(allUsers[i]);
      // check for expected like #
      expect(Number(contractUsers[i].numberOfLikes)).to.equal(expectedLikes[i]);
    }
  });
});
