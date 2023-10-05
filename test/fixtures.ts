import { ethers } from 'hardhat';
import {
  BACKEND_PRIVATE_KEY,
  BACKEND_REGISTRATION_FEE,
  FIRST_TAG,
  FIRST_TITLE,
  FIRST_URL,
  SECOND_TAG,
  SECOND_TITLE,
  SECOND_URL,
  SLASHING_FEE,
  TIME_THRESHOLD,
} from '../constants';
import {
  loadFixture,
  setBalance,
} from '@nomicfoundation/hardhat-network-helpers';

// We define a fixture to reuse the same setup in every test.
// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshot in every test.
export async function deployContractFixture() {
  // Contracts are deployed using the first signer/account by default
  const [deployer, otherAccount1, otherAccount2] = await ethers.getSigners();

  const Channel4Contract = await ethers.getContractFactory('Channel4Contract');
  const channel4Contract = await Channel4Contract.deploy(
    FIRST_TITLE,
    FIRST_URL,
    FIRST_TAG,
    SLASHING_FEE,
    BACKEND_REGISTRATION_FEE,
    TIME_THRESHOLD,
  );

  const backendWallet = new ethers.Wallet(BACKEND_PRIVATE_KEY, ethers.provider);
  await setBalance(backendWallet.address, BACKEND_REGISTRATION_FEE * 3n);
  await channel4Contract.connect(backendWallet).registerBackend({
    value: BACKEND_REGISTRATION_FEE,
  });

  return {
    channel4Contract,
    deployer,
    otherAccount1,
    otherAccount2,
    backendWallet,
  };
}

export async function createContentIfNotExistsFixture() {
  const {
    channel4Contract,
    deployer,
    otherAccount1,
    otherAccount2,
    backendWallet,
  } = await loadFixture(deployContractFixture);
  await channel4Contract.connect(backendWallet).createUserIfNotExists({
    userAddress: otherAccount1.address,
    numberOfLikes: 0,
    submittedContent: [],
    registeredAt: 0,
    numberOfLikesInPeriod: 0,
  });
  const contentObj = {
    title: SECOND_TITLE,
    url: SECOND_URL,
    submittedBy: otherAccount1.address,
    likes: 0,
    tags: [FIRST_TAG, SECOND_TAG],
  };
  await channel4Contract
    .connect(backendWallet)
    .createContentIfNotExists(
      contentObj.title,
      contentObj.url,
      contentObj.submittedBy,
      contentObj.likes,
      contentObj.tags,
    );
  return {
    channel4Contract,
    deployer,
    otherAccount1,
    otherAccount2,
    contentObj,
    backendWallet,
  };
}

export async function likeContentFixture() {
  const {
    channel4Contract,
    deployer,
    otherAccount1,
    otherAccount2,
    contentObj,
    backendWallet,
  } = await loadFixture(createContentIfNotExistsFixture);
  const nonce = 1;
  await channel4Contract
    .connect(backendWallet)
    .toggleLike(contentObj.url, true, nonce, otherAccount1.address);
  return {
    channel4Contract,
    deployer,
    otherAccount1,
    otherAccount2,
    contentObj,
    backendWallet,
    nonce,
  };
}

export async function prepareEIP712LitigateContentFixture() {
  const { channel4Contract, otherAccount1, otherAccount2, backendWallet } =
    await loadFixture(createContentIfNotExistsFixture);
  const EIP712Domain = await channel4Contract.eip712Domain();
  const domain = {
    name: EIP712Domain.name,
    version: EIP712Domain.version,
    chainId: EIP712Domain.chainId,
    verifyingContract: EIP712Domain.verifyingContract,
  };
  const types = {
    ContentToLitigate: [
      { name: 'title', type: 'string' },
      { name: 'url', type: 'string' },
      { name: 'submittedBy', type: 'address' },
      { name: 'likes', type: 'uint256' },
      { name: 'tagIds', type: 'string[]' },
      { name: 'timestamp', type: 'uint256' },
    ],
  };
  return {
    channel4Contract,
    otherAccount1,
    otherAccount2,
    domain,
    types,
    backendWallet,
  };
}

export async function prepareEIP712LitigateTagFixture() {
  const { channel4Contract, otherAccount1, otherAccount2, backendWallet } =
    await loadFixture(createContentIfNotExistsFixture);
  const EIP712Domain = await channel4Contract.eip712Domain();
  const domain = {
    name: EIP712Domain.name,
    version: EIP712Domain.version,
    chainId: EIP712Domain.chainId,
    verifyingContract: EIP712Domain.verifyingContract,
  };
  const types = {
    TagToSync: [
      { name: 'name', type: 'string' },
      { name: 'createdBy', type: 'address' },
    ],
  };
  return {
    channel4Contract,
    otherAccount1,
    otherAccount2,
    domain,
    types,
    backendWallet,
  };
}

export async function prepareEIP712LitigateLikeFixture() {
  const { channel4Contract, otherAccount1, otherAccount2, backendWallet } =
    await loadFixture(likeContentFixture);
  const EIP712Domain = await channel4Contract.eip712Domain();
  const domain = {
    name: EIP712Domain.name,
    version: EIP712Domain.version,
    chainId: EIP712Domain.chainId,
    verifyingContract: EIP712Domain.verifyingContract,
  };
  const types = {
    Pending: [
      { name: 'submittedBy', type: 'address' },
      { name: 'url', type: 'string' },
      { name: 'liked', type: 'bool' },
      { name: 'nonce', type: 'uint256' },
    ],
  };
  return {
    channel4Contract,
    otherAccount1,
    otherAccount2,
    domain,
    types,
    backendWallet,
  };
}
