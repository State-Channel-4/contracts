import { expect } from "chai";
import { ethers } from "hardhat";
import { deployContractFixture, prepareEIP712LitigateContentFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { BACKEND_PRIVATE_KEY, BACKEND_REGISTRATION_FEE, VALUE_TO_RECHARGE } from "../constants";

describe("Slasher", async function () {
    it("Should register only one backend address", async function () {
        const { channel4Contract, otherAccount1 } = await loadFixture(deployContractFixture);

        const backendPublicAddress = await channel4Contract.backendAddress();
        const backendVault = await channel4Contract.backendVault();
        const backendWallet = new ethers.Wallet(BACKEND_PRIVATE_KEY);

        expect(backendPublicAddress).to.equal(backendWallet.address);
        expect(backendVault).to.equal(BACKEND_REGISTRATION_FEE);
        await expect(
            channel4Contract.connect(otherAccount1).registerBackend({
                value: BACKEND_REGISTRATION_FEE,
            })
        ).to.be.revertedWith("Backend vault is full. No backend can be registered");
    });

    it("Should recharge the backend vault", async function () {
        const { channel4Contract, otherAccount1 } = await loadFixture(deployContractFixture);

        const backendWallet = new ethers.Wallet(BACKEND_PRIVATE_KEY, ethers.provider);
        const valueToRecharge = VALUE_TO_RECHARGE;

        const backendVaultOld = await channel4Contract.backendVault();

        await channel4Contract.connect(backendWallet).rechargeVault({
            value: valueToRecharge,
        });

        const backendVaultNew = await channel4Contract.backendVault();
        expect(backendVaultNew).to.equal( backendVaultOld + valueToRecharge );
        await expect(
            channel4Contract.connect(otherAccount1).rechargeVault({
                value: valueToRecharge,
            })
        ).to.be.revertedWith("Only backend can recharge vault");
    });

    it("Should not slash backend outside contract functions", async function () {
        const { channel4Contract } = await loadFixture(deployContractFixture);
        expect(channel4Contract).to.not.have.property("slashBackend");
    });

    it("Should remove backend address if vault is low enough", async function () {
        const { channel4Contract, otherAccount1, domain, types, backendWallet } = await loadFixture(prepareEIP712LitigateContentFixture);
        // if vault is not low enough then revert remove function
        await expect(
            channel4Contract.connect(backendWallet).removeBackend()
        ).to.be.revertedWith('Backend vault is not qualified to be removed');

        // litigate and lose
        for (let i = 0; i < 8; i++) {
            const content = {
                title: `Something-${i}`,
                url: `https://www.something.com/${i}`,
                submittedBy: otherAccount1.address,
                likes: 0,
                tagIds: ['something'],
            };
            const EIPSignature = await backendWallet.signTypedData(domain, types, content);
            await channel4Contract.litigateContent(content, EIPSignature);
        }

        // try remove again and it should work
        await channel4Contract.connect(backendWallet).removeBackend();

        const backendVault = await channel4Contract.backendVault();
        const contractBalance = await ethers.provider.getBalance(await channel4Contract.getAddress());
        expect(Number(backendVault)).to.equal(0);
        expect(Number(contractBalance)).to.equal(0);
    });
});