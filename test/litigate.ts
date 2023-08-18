import { expect } from "chai";
import { ethers } from "hardhat";
import { prepareEIP712LitigateContentFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { FIRST_TAG, SECOND_TAG, SLASHING_FEE } from "../constants";

describe("Litigate", async function () {
    it("Should add a missing content", async function () {
        const { channel4Contract, otherAccount1, domain, types, backendWallet } = await loadFixture(prepareEIP712LitigateContentFixture);
        const content = {
            title: 'Batman',
            url: 'https://www.dc.com/characters/batman',
            submittedBy: otherAccount1.address,
            likes: 0,
            tagIds: ['superhero'],
        };
        const EIPSignature = await backendWallet.signTypedData(domain, types, content);

        const allContentBefore = await channel4Contract.getAllContent();
        const contractBalanceBefore = await ethers.provider.getBalance(await channel4Contract.getAddress());
        const backendVaultBefore = await channel4Contract.backendVault();

        await channel4Contract.connect(otherAccount1).litigateContent(content, EIPSignature);

        const allContentAfter = await channel4Contract.getAllContent();
        const contractBalanceAfter = await ethers.provider.getBalance(await channel4Contract.getAddress());
        const backendVaultAfter = await channel4Contract.backendVault();
        const allTags = await channel4Contract.getAllTags();
        const lengthBefore = allContentBefore.length;
        const lengthAfter = allContentAfter.length;

        expect(lengthAfter).to.equal(lengthBefore + 1);
        expect(allContentAfter[lengthAfter - 1].title).to.equal(content.title);
        expect(allContentAfter[lengthAfter - 1].url).to.equal(content.url);
        expect(allContentAfter[lengthAfter - 1].submittedBy).to.equal(content.submittedBy);
        expect(allContentAfter[lengthAfter - 1].likes).to.equal(content.likes);
        const tagIds = allContentAfter[lengthAfter - 1].tagIds;
        for (let i = 0, ni = tagIds.length; i < ni; i++) {
            const tagId = Number(tagIds[i]);
            const tag = allTags[tagId];
            expect(content.tagIds[i]).to.include(tag.name);
        }
        // slashing checks
        expect(contractBalanceAfter).to.equal(contractBalanceBefore - SLASHING_FEE);
        expect(backendVaultAfter).to.equal(backendVaultBefore - SLASHING_FEE);
    });

    it("Should prevent litigation in correct content", async function () {
        const { channel4Contract, otherAccount1, domain, types, backendWallet } = await loadFixture(prepareEIP712LitigateContentFixture);
        const content = {
            title: 'Google',
            url: 'https://google.com/',
            submittedBy: otherAccount1.address,
            likes: 0,
            tagIds: [FIRST_TAG, SECOND_TAG],
        };
        const EIPSignature = await backendWallet.signTypedData(domain, types, content);

        const allContentBefore = await channel4Contract.getAllContent();
        await channel4Contract.connect(otherAccount1).litigateContent(content, EIPSignature);
        const allContentAfter = await channel4Contract.getAllContent();
        expect(allContentAfter.length).to.equal(allContentBefore.length);
    });
});