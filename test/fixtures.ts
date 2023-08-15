import { ethers } from "hardhat";
import { firstTag, firstTitle, firstUrl, secondTag, secondTitle, secondUrl } from "../constants";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";


// We define a fixture to reuse the same setup in every test.
// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshot in every test.
export async function deployContractFixture(){
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount1, otherAccount2] = await ethers.getSigners();

    const Channel4Contract = await ethers.getContractFactory("Channel4Contract");
    const channel4Contract = await Channel4Contract.deploy(firstTitle, firstUrl, firstTag);

    return { channel4Contract, owner, otherAccount1, otherAccount2 };
}

export async function createContentIfNotExistsFixture(){
    const { channel4Contract, owner, otherAccount1, otherAccount2 } = await loadFixture(deployContractFixture);
    const contentObj = {
        title: secondTitle,
        url: secondUrl,
        submittedBy: otherAccount1.address,
        likes: 0,
        tags: [firstTag, secondTag],
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
    await channel4Contract.connect(otherAccount1).likeContent(0);
    return { channel4Contract, owner, otherAccount1, otherAccount2, contentObj };
}