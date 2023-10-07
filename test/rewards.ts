import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { deployContractFixture } from './fixtures';
import { REGISTRATION_THRESHOLD, VALUE_TO_DONATE } from '../constants';
import { ethers } from 'hardhat';

describe('Rewards', async function () {
  it('Should succesfully receive donations', async () => {
    const { channel4Contract } = await loadFixture(deployContractFixture);
    const contractBalanceBefore = await ethers.provider.getBalance(
      await channel4Contract.getAddress(),
    );
    const rewardsVaultBefore = await channel4Contract.rewardsVault();
    await channel4Contract.receiveDonations({ value: VALUE_TO_DONATE });
    const rewardsVaultAfter = await channel4Contract.rewardsVault();
    const contractBalanceAfter = await ethers.provider.getBalance(
      await channel4Contract.getAddress(),
    );

    expect(rewardsVaultAfter).to.equal(rewardsVaultBefore + VALUE_TO_DONATE);
    expect(contractBalanceAfter).to.equal(
      contractBalanceBefore + VALUE_TO_DONATE,
    );
  });

  it('Should successfully withdraw rewards from backend', async () => {
    const { channel4Contract, backendWallet } = await loadFixture(
      deployContractFixture,
    );
    await channel4Contract.receiveDonations({ value: VALUE_TO_DONATE });
    const contractBalanceBefore = await ethers.provider.getBalance(
      await channel4Contract.getAddress(),
    );
    await channel4Contract.connect(backendWallet).withdrawRemainingRewards();
    const rewardsVaultAfter = await channel4Contract.rewardsVault();
    const contractBalanceAfter = await ethers.provider.getBalance(
      await channel4Contract.getAddress(),
    );

    expect(rewardsVaultAfter).to.equal(0);
    expect(contractBalanceAfter).to.equal(
      contractBalanceBefore - VALUE_TO_DONATE,
    );
  });

  it('Should succesfully withdraw rewards from user', async () => {
    const { channel4Contract, backendWallet, otherAccount1 } =
      await loadFixture(deployContractFixture);
    await channel4Contract.connect(backendWallet).syncState(
      [
        {
          userAddress: otherAccount1.address,
          numberOfLikes: 7,
          submittedContent: [],
          registeredAt:
            BigInt(await time.latest()) + REGISTRATION_THRESHOLD + BigInt(1),
          numberOfLikesInPeriod: 5,
        },
      ],
      [],
      [],
      [],
    );
    await channel4Contract.receiveDonations({ value: VALUE_TO_DONATE });
    await channel4Contract.connect(otherAccount1).withdrawRewards();
  });

  it('Should prevent withdraw if likes are not enough', async () => {});

  it('Should prevent withdraw if user was registered recently', async () => {});

  it('Should prevent withdraw if user called it before end of month', async () => {});

  it('Should succesfully update the last month value', async () => {});
});
