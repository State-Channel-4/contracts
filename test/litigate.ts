import { expect } from "chai";
import { ethers } from "hardhat";
import { deployContractFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { BACKEND_PRIVATE_KEY } from "../constants";

describe("Litigate", async function () {
    it("Should succesfully litigate a content", async function () {
        const { channel4Contract, otherAccount1 } = await loadFixture(deployContractFixture);
        const domain = {
            name: 'Channel4Contract',
            version: '0.0.1',
            chainId: 1,
            verifyingContract: await channel4Contract.getAddress()
        };
        const types = {
            ContentToAdd: [
                { name: 'title', type: 'string' },
                { name: 'url', type: 'string' },
                { name: 'submittedBy', type: 'address' },
                { name: 'likes', type: 'uint256' },
                { name: 'tagIds', type: 'string[]' },
            ],
        };
        const content = {
            title: 'Batman',
            url: 'https://www.dc.com/characters/batman',
            submittedBy: otherAccount1.address,
            likes: 0,
            tagIds: ['zero-knowledge'],
        };
        const backendWallet = new ethers.Wallet(BACKEND_PRIVATE_KEY);
        const EIPSignature = await backendWallet.signTypedData(domain, types, content);
        const signer = await channel4Contract.litigateContent(content, EIPSignature);
        console.log('Something is wrong with the signatures')
        console.log(backendWallet.address)
        console.log(signer)
        // TODO: setup expects
    });
});