// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Data } from "./Data.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

abstract contract Interact is Data, Ownable {
    /// Interaction functions

    /// @notice Like a specific content
    /// @param url content url (works as an id)
    /// @param submittedBy user that submitted the content
    function likeContent(string memory url, address submittedBy) public onlyOwner {
        uint256 indexContent = contents.ids[url];
        address userAddress = submittedBy;
        uint256 userIndex = users.ids[userAddress];
        User storage user = users.list[userIndex];

        require(users.likedContent[userAddress][indexContent] == false, "Content already liked");
        user.numberOfLikedContent = user.numberOfLikedContent + 1;
        users.likedContent[userAddress][indexContent] = true;
        contents.list[indexContent].likes = contents.list[indexContent].likes + 1;
    }

    /// @notice Unlike a specific URL
    /// @param url content url (works as an id)
    /// @param submittedBy user that submitted the content
    function unlikeContent(string memory url, address submittedBy) public onlyOwner {
        uint256 indexContent = contents.ids[url];
        address userAddress = submittedBy;
        uint256 userIndex = users.ids[userAddress];
        User storage user = users.list[userIndex];

        require(users.likedContent[userAddress][indexContent] == true, "Content already unliked");
        user.numberOfLikedContent = user.numberOfLikedContent - 1;
        users.likedContent[userAddress][indexContent] = false;
        contents.list[indexContent].likes = contents.list[indexContent].likes - 1;
    }
}