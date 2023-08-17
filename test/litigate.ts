import { expect } from "chai";
import { prepareEIP712LitigateContentFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { FIRST_TAG, SECOND_TAG } from "../constants";

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
        const result = await channel4Contract.litigateContent(content, EIPSignature);

        const allContent = await channel4Contract.getAllContent();
        console.log(allContent);

        console.log(result);
        // TODO: setup expects
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
        const result = await channel4Contract.litigateContent(content, EIPSignature);
        console.log(result);
        // TODO: setup expects
    });
});