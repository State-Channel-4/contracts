import { expect } from "chai";
import { ethers } from "hardhat";
import { deployContractFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { BACKEND_PRIVATE_KEY, BACKEND_REGISTRATION_FEE } from "../constants";

describe("Slasher", async function () {
    it("Should register only one backend address", async function () {
        const { channel4Contract, otherAccount1 } = await loadFixture(deployContractFixture);

        const backendPublicAddress = await channel4Contract.backendAddress();
        const backendVault = await channel4Contract.backendVault();
        const backendWallet = new ethers.Wallet(BACKEND_PRIVATE_KEY);

        expect(backendPublicAddress).to.equal(backendWallet.address);
        expect(backendVault).to.equal(ethers.parseEther(BACKEND_REGISTRATION_FEE));
        await expect(
            channel4Contract.connect(otherAccount1).registerBackend({
                value: ethers.parseEther(BACKEND_REGISTRATION_FEE),
            })
        ).to.be.revertedWith("Backend vault is full. No backend can be registered");
    });

    it("Should recharge the backend vault", async function () {
        const { channel4Contract, otherAccount1 } = await loadFixture(deployContractFixture);

        const backendWallet = new ethers.Wallet(BACKEND_PRIVATE_KEY, ethers.provider);
        const valueToRecharge = ethers.parseEther("0.01");

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
        const { channel4Contract, owner } = await loadFixture(deployContractFixture);
        // TODO: complete this test
    });
});