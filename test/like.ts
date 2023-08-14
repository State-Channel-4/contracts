import { expect } from "chai";
import { likeContentFixture } from "./fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Like", async function () {
    it("Should successfully like a Content", async function () {
      const { channel4Contract, otherAccount1 } = await loadFixture(likeContentFixture);

      const content = await channel4Contract.getContent(0);
      expect( Number(content.likes) ).to.equal(1);

      const userLikedContents = await channel4Contract.getUserLikedContent(otherAccount1.address);
      expect( userLikedContents.length ).to.equal(1);
      expect ( Number(userLikedContents[0].likes) ).to.equal(1);

    });
});