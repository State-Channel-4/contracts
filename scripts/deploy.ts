import { ethers } from 'hardhat';
import {
  BACKEND_PRIVATE_KEY,
  BACKEND_REGISTRATION_FEE,
  FIRST_TAG,
  FIRST_TITLE,
  FIRST_URL,
  SLASHING_FEE,
} from '../constants';
async function main() {
  const network = await ethers.provider.getNetwork();
  console.log(`====================================`);
  console.log(`Deploying Channel4Contract to ${network.name} (${network.chainId})...`)
  
  // deploy contract
  const Channel4Contract = await ethers.getContractFactory('Channel4Contract');
  const channel4Contract = await Channel4Contract.deploy(
    FIRST_TITLE,
    FIRST_URL,
    FIRST_TAG,
    SLASHING_FEE,
    BACKEND_REGISTRATION_FEE,
  );
  await channel4Contract.waitForDeployment();

  // log deployment info
  console.log(`====================================`);
  console.log(`Channel4Contract deployed to '${await channel4Contract.getAddress()}'`);
  console.log(`Deployment parameters: `);
  console.log(` - First URL Title: "${FIRST_TITLE}"`);
  console.log(` - First URL: "${FIRST_URL}"`);
  console.log(` - First Tag: "${FIRST_TAG}"`);
  console.log(` - Slashing Fee: ${ethers.formatEther(SLASHING_FEE)} ether`);
  console.log(` - Backend Registration Fee: ${ethers.formatEther(BACKEND_REGISTRATION_FEE)} ether`);
  console.log(`====================================`);

  // register deployer as backend
  const [deployer] = await ethers.getSigners();
  let tx = await channel4Contract.connect(deployer).registerBackend({
    value: BACKEND_REGISTRATION_FEE,
  });
  await tx.wait();
  console.log(`Registerd contract deployer ${deployer.address} as backend`);
  console.log(`====================================`);


  // @todo: etherscan verification
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
