import { ethers } from 'hardhat';
import { FIRST_TAG } from '../constants';

async function main() {
  const UrlContract = await ethers.getContractFactory('UrlContract');
  const urlContract = await UrlContract.deploy(FIRST_TAG);

  await urlContract.deployed();

  console.log(
    `UrlContract deployed to ${urlContract.address} with first tag ${FIRST_TAG}`,
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
