import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import {
  deployContractFixture,
  prepareWithdrawRewardsFixture,
} from './fixtures';
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
      await loadFixture(prepareWithdrawRewardsFixture);
    // you can modify the user object with the sync function
    await channel4Contract.connect(backendWallet).syncState(
      [
        {
          userAddress: otherAccount1.address,
          numberOfLikes: 7,
          submittedContent: [],
          registeredAt: BigInt(await time.latest()),
          numberOfLikesInPeriod: 5,
          urlNonces: [],
        },
      ],
      [],
      [],
    );
    await time.increase(BigInt(60 * 60 * 24 * 30));
    await channel4Contract.connect(otherAccount1).withdrawRewards();
  });

  it('Should prevent withdraw if likes are not enough', async () => {
    const { channel4Contract, backendWallet, otherAccount1 } =
      await loadFixture(prepareWithdrawRewardsFixture);
    // you can modify the user object with the sync function
    await channel4Contract.connect(backendWallet).syncState(
      [
        {
          userAddress: otherAccount1.address,
          numberOfLikes: 7,
          submittedContent: [],
          registeredAt: BigInt(await time.latest()),
          numberOfLikesInPeriod: 3,
          urlNonces: [],
        },
      ],
      [],
      [],
    );
    await time.increase(BigInt(60 * 60 * 24 * 30));
    await expect(
      channel4Contract.connect(otherAccount1).withdrawRewards(),
    ).to.be.revertedWith('User has not enough likes in period');
  });

  it('Should prevent withdraw if user was registered recently', async () => {
    const { channel4Contract, backendWallet, otherAccount1 } =
      await loadFixture(prepareWithdrawRewardsFixture);
    // you can modify the user object with the sync function
    await channel4Contract.connect(backendWallet).syncState(
      [
        {
          userAddress: otherAccount1.address,
          numberOfLikes: 7,
          submittedContent: [],
          registeredAt: BigInt(await time.latest()),
          numberOfLikesInPeriod: 5,
          urlNonces: [],
        },
      ],
      [],
      [],
    );
    await time.increase(REGISTRATION_THRESHOLD - BigInt(10));
    await expect(
      channel4Contract.connect(otherAccount1).withdrawRewards(),
    ).to.be.revertedWith('User was recently registered');
  });

  it('Should prevent withdraw if user called it before end of month', async () => {
    const { channel4Contract, backendWallet, otherAccount1 } =
      await loadFixture(prepareWithdrawRewardsFixture);
    // you can modify the user object with the sync function
    await channel4Contract.connect(backendWallet).syncState(
      [
        {
          userAddress: otherAccount1.address,
          numberOfLikes: 7,
          submittedContent: [],
          registeredAt: BigInt(await time.latest()),
          numberOfLikesInPeriod: 5,
          urlNonces: [],
        },
      ],
      [],
      [],
    );
    await time.increase(BigInt(60 * 60 * 24 * 29));
    await expect(
      channel4Contract.connect(otherAccount1).withdrawRewards(),
    ).to.be.revertedWith('It is not time to withdraw rewards yet');
  });

  it('Should succesfully update the last month value', async () => {
    const { channel4Contract, backendWallet, otherAccount1 } =
      await loadFixture(prepareWithdrawRewardsFixture);
    // you can modify the user object with the sync function
    await channel4Contract.connect(backendWallet).syncState(
      [
        {
          userAddress: otherAccount1.address,
          numberOfLikes: 7,
          submittedContent: [],
          registeredAt: BigInt(await time.latest()),
          numberOfLikesInPeriod: 5,
          urlNonces: [],
        },
      ],
      [],
      [],
    );
    await time.increase(BigInt(60 * 60 * 24 * 33));
    await channel4Contract.connect(otherAccount1).withdrawRewards();
    const lastMonthAfter = await channel4Contract.lastMonth();
    expect(lastMonthAfter).to.equal(BigInt(await time.latest()));
  });
});
