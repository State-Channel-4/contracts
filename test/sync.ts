import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployContractFixture } from './fixtures';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import {
  CONTENT_TO_ADD,
  FIRST_TAG,
  FIRST_TITLE,
  FIRST_URL,
  TAGS_TO_ADD,
  USERS_TO_ADD,
} from '../constants';

describe('Sync', async function () {
  it('Should succesfully load a bunch of content to the contract state', async function () {
    const { channel4Contract, deployer, backendWallet } = await loadFixture(
      deployContractFixture,
    );
    await channel4Contract
      .connect(backendWallet)
      .syncState([], [], CONTENT_TO_ADD);

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
      .syncState([], TAGS_TO_ADD, []);

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
      .syncState(USERS_TO_ADD, [], []);

    const allUsersInContract = await channel4Contract.getAllUsers();
    const allUsersInBackend = [
      {
        userAddress: deployer.address,
        numberOfLikes: 0,
        submittedContent: [0],
        registeredAt: await time.latest(),
        numberOfLikesInPeriod: 0,
      },
      ...USERS_TO_ADD,
    ];

    for (let i = 0, ni = allUsersInContract.length; i < ni; i++) {
      expect(allUsersInContract[i].userAddress).to.equal(
        allUsersInBackend[i].userAddress,
      );
      expect(Number(allUsersInContract[i].numberOfLikes)).to.equal(
        allUsersInBackend[i].numberOfLikes,
      );
      const contentInContract = allUsersInContract[i].submittedContent;
      const contentInBackend = allUsersInBackend[i].submittedContent;
      for (let j = 0, nj = contentInContract.length; j < nj; j++) {
        expect(Number(contentInContract[j])).to.equal(contentInBackend[j]);
      }
      // it is a bit hard to check the registeredAt timestamp so we leave that one in /test/create.ts
      expect(Number(allUsersInContract[i].numberOfLikesInPeriod)).to.equal(
        allUsersInBackend[i].numberOfLikesInPeriod,
      );
    }
  });

  it('Should succesfully load a bunch of likes to the contract state', async function () {
    // load deployed contract fixture
    const { channel4Contract, backendWallet } = await loadFixture(
      deployContractFixture,
    );

    // load accounts for test
    const [deployer, alice, bob] = await ethers.getSigners();
    const usersToAdd = [
      USERS_TO_ADD[0],
      {
        userAddress: alice.address,
        numberOfLikes: 1,
        submittedContent: [],
        registeredAt: 0,
        numberOfLikesInPeriod: 0,
        urlNonces: [
          {
            url: 0, // first content
            nonce: 1,
            liked: true,
          },
        ],
      },
      {
        userAddress: bob.address,
        numberOfLikes: 1,
        submittedContent: [],
        registeredAt: 0,
        numberOfLikesInPeriod: 0,
        urlNonces: [
          {
            url: 0, // first content
            nonce: 1,
            liked: true,
          },
        ],
      },
    ];
    const allUsers = [
      {
        userAddress: deployer.address,
        numberOfLikes: 0,
        submittedContent: [0],
        registeredAt: await time.latest(),
        numberOfLikesInPeriod: 0,
        urlNonces: [],
      },
      ...usersToAdd,
    ];
    CONTENT_TO_ADD[0].likes = 2;

    // sync state
    await channel4Contract
      .connect(backendWallet)
      .syncState(usersToAdd, TAGS_TO_ADD, CONTENT_TO_ADD);

    // check for existence of content with expected likes
    for (let i = 0; i < CONTENT_TO_ADD.length; i++) {
      const contentToAdd = CONTENT_TO_ADD[i];
      const contentInContract = await channel4Contract.getContent(
        contentToAdd.url,
      );
      expect(Number(contentToAdd.likes)).to.equal(
        Number(contentInContract.likes),
      );
    }

    // check for existence of users with expected likes
    const contractUsers = await channel4Contract.getAllUsers();
    for (let i = 0; i < contractUsers.length; i++) {
      const user = allUsers[i];
      const contractUser = contractUsers[i];
      // check for expected address
      expect(contractUser.userAddress).to.equal(user.userAddress);
      // check for expected like number
      expect(Number(contractUser.numberOfLikes)).to.equal(user.numberOfLikes);
    }
  });
});
