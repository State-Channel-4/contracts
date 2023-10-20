import { ethers } from 'hardhat';
import {
  BACKEND_PRIVATE_KEY,
  BACKEND_REGISTRATION_FEE,
  FIRST_TAG,
  FIRST_TITLE,
  FIRST_URL,
  LIKES_IN_PERIOD_THRESHOLD,
  REGISTRATION_THRESHOLD,
  REWARDS_AMOUNT,
  SLASHING_FEE,
  TIME_THRESHOLD,
} from '../constants';
async function main() {
  const network = await ethers.provider.getNetwork();
  console.log(`====================================`);
  console.log(
    `Deploying Channel4Contract to ${network.name} (${network.chainId})...`,
  );
  const backendWallet = new ethers.Wallet(BACKEND_PRIVATE_KEY, ethers.provider);

  // deploy contract
  const Channel4Contract = await ethers.getContractFactory('Channel4Contract');
  const channel4Contract = await Channel4Contract.connect(backendWallet).deploy(
    {
      title: FIRST_TITLE,
      url: FIRST_URL,
      tag: FIRST_TAG,
      slashingFee: SLASHING_FEE,
      backendRegistrationFee: BACKEND_REGISTRATION_FEE,
      timeThreshold: TIME_THRESHOLD,
      registrationThreshold: REGISTRATION_THRESHOLD,
      likesInPeriodThreshold: LIKES_IN_PERIOD_THRESHOLD,
      rewardsAmount: REWARDS_AMOUNT,
    },
  );
  await channel4Contract.connect(backendWallet).waitForDeployment();

  // log deployment info
  console.log(`====================================`);
  console.log(
    `Channel4Contract deployed to '${await channel4Contract.getAddress()}'`,
  );
  console.log(`Deployment parameters: `);
  console.log(` - First URL Title: "${FIRST_TITLE}"`);
  console.log(` - First URL: "${FIRST_URL}"`);
  console.log(` - First Tag: "${FIRST_TAG}"`);
  console.log(` - Slashing Fee: ${ethers.formatEther(SLASHING_FEE)} ether`);
  console.log(
    ` - Backend Registration Fee: ${ethers.formatEther(
      BACKEND_REGISTRATION_FEE,
    )} ether`,
  );
  console.log(` - Time Threshold: ${TIME_THRESHOLD} seconds`);
  console.log(`====================================`);

  // register deployer as backend
  let tx = await channel4Contract.connect(backendWallet).registerBackend({
    value: BACKEND_REGISTRATION_FEE,
  });
  await tx.wait();
  console.log(
    `Registered contract deployer ${backendWallet.address} as backend`,
  );
  console.log(`====================================`);

  // @todo: etherscan verification
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
