import { ethers } from "hardhat";
import { FIRST_TAG, FIRST_TITLE, FIRST_URL, SECOND_TAG, SECOND_TITLE, SECOND_URL } from "../constants";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";


// We define a fixture to reuse the same setup in every test.
// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshot in every test.
export async function deployContractFixture(){
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount1, otherAccount2] = await ethers.getSigners();

    const Channel4Contract = await ethers.getContractFactory("Channel4Contract");
    const channel4Contract = await Channel4Contract.deploy(FIRST_TITLE, FIRST_URL, FIRST_TAG);

    return { channel4Contract, owner, otherAccount1, otherAccount2 };
}

export async function createContentIfNotExistsFixture(){
    const { channel4Contract, owner, otherAccount1, otherAccount2 } = await loadFixture(deployContractFixture);
    const contentObj = {
        title: SECOND_TITLE,
        url: SECOND_URL,
        submittedBy: otherAccount1.address,
        likes: 0,
        tags: [FIRST_TAG, SECOND_TAG],
    };
    await channel4Contract.createContentIfNotExists(
        contentObj.title,
        contentObj.url,
        contentObj.submittedBy,
        contentObj.likes,
        contentObj.tags,
    );
    return { channel4Contract, owner, otherAccount1, otherAccount2, contentObj };
}

export async function likeContentFixture(){
    const { channel4Contract, owner, otherAccount1, otherAccount2, contentObj } = await loadFixture(createContentIfNotExistsFixture);
    await channel4Contract.likeContent(
        contentObj.url,
        otherAccount1.address,
    );
    return { channel4Contract, owner, otherAccount1, otherAccount2, contentObj };
}