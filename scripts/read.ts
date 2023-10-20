import { ethers } from 'hardhat';
import { BACKEND_PRIVATE_KEY } from '../constants';
import { abi } from '../artifacts/contracts/Channel4Contract.sol/Channel4Contract.json';
import { Channel4Contract } from '../typechain-types';

async function main() {
  const contractAddress = '0x6189a62161FEDfFeBc5A56ffA419978937618843';
  const backendWallet = new ethers.Wallet(BACKEND_PRIVATE_KEY, ethers.provider);
  const channel4Contract = (await ethers.getContractAt(
    abi,
    contractAddress,
    backendWallet,
  )) as unknown as Channel4Contract;

  const users = await channel4Contract.getAllUsers();
  const tags = await channel4Contract.getAllTags();
  const contents = await channel4Contract.getAllContent();

  console.log(users);
  console.log(tags);
  console.log(contents);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
