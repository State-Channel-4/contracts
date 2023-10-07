import { ethers } from 'hardhat';

export const BACKEND_PUBLIC_ADDRESS =
  '0xb4a5714dd934a3391Bc670BEc9aee18b821e1Fd5';
export const BACKEND_PRIVATE_KEY =
  'bd0cef31fef0e40085b0f2801744057feb0a6b3d3a7d96d01eac0c08eea2e596';
export const USER_PUBLIC_ADDRESS = '0xE4721A80C6e56f4ebeed6acEE91b3ee715e7dD64';

export const BACKEND_REGISTRATION_FEE = ethers.parseEther('0.01');
export const SLASHING_FEE = ethers.parseEther('0.001');
export const VALUE_TO_RECHARGE = ethers.parseEther('0.01');

export const TIME_THRESHOLD = BigInt(30);

export const REGISTRATION_THRESHOLD = BigInt(60 * 60 * 24);
export const LIKES_IN_PERIOD_THRESHOLD = BigInt(3);
export const REWARDS_AMOUNT = ethers.parseEther('0.0001');
export const VALUE_TO_DONATE = ethers.parseEther('0.01');

export const FIRST_TITLE = 'Privacy & Scaling Explorations';
export const FIRST_URL = 'https://pse.dev/';
export const FIRST_TAG = 'zero-knowledge';

export const SECOND_TITLE = 'Google';
export const SECOND_URL = 'https://google.com/';
export const SECOND_TAG = 'web-search';

export const USERS_TO_ADD = [
  {
    userAddress: USER_PUBLIC_ADDRESS,
    numberOfLikes: 0,
    submittedContent: [],
    registeredAt: 0,
    numberOfLikesInPeriod: 0,
  },
];
export const TAGS_TO_ADD = [
  {
    name: 'music',
    createdBy: USER_PUBLIC_ADDRESS,
    contentIds: ['https://google.com/', 'https://inno-maps.com/'],
  },
];
export const CONTENT_TO_ADD = [
  {
    title: 'Innomaps',
    url: 'https://inno-maps.com/',
    submittedBy: USER_PUBLIC_ADDRESS,
    likes: 0,
    tagIds: ['zero-knowledge', 'web-search'],
  },
];
