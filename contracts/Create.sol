// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Data } from "./Data.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

abstract contract Create is Data, Ownable {
    /// Creation functions

    /// @notice Save URL in smart contract. Create tags if they don't exist
    /// @dev The function flow is: get url id, create tags (and save url id), save url
    /// @param title content title
    /// @param url content link. It works as an id as well because it is unique
    /// @param _tags Tag names list associated with that content
    function createContentIfNotExists(
        string memory title,
        string memory url,
        address submittedBy,
        uint256 likes,
        string[] calldata _tags
    ) public onlyOwner returns (uint256) {
        require(bytes(title).length > 0 && bytes(url).length > 0 && _tags.length > 0, "Invalid input");
        uint256 userIndex = createUserIfNotExists(submittedBy);
        // If tx fails then changes rollback. We can be sure content index in the beginning = content index in the end
        uint256 contentIndex = contents.list.length;
        // get tag indexes or create new tags. Also add content index to each tag
        uint256[] memory tagIndexes = new uint256[](_tags.length);
        for (uint256 i = 0; i < _tags.length; i++) {
            tagIndexes[i] = createTagIfNotExists(_tags[i], submittedBy);
            tags.list[tagIndexes[i]].contentIds.push(contentIndex);
        }
        Content memory newContent = Content(title, url, submittedBy, likes, tagIndexes);
        // check if content is the first one in the array
        string memory firstContentUrl = contents.list[0].url;
        if (keccak256(bytes(url)) == keccak256(bytes(firstContentUrl))){
            contents.list[0] = newContent;
            return 0;
        }
        // check if content is already registered
        uint256 index = contents.ids[url];
        if (index == 0){
            // add new content to array
            contents.list.push(newContent);
            contents.ids[url] = contentIndex;
            // add new content to user submitted content
            users.list[userIndex].submittedContent.push(contentIndex);
            return contentIndex;
        } else {
            // update content
            contents.list[index] = newContent; // TODO: if we do it in parts/bulk can we save gas?
            return index;
        }
    }

    /// @notice Get a tag id from array or add a new tag if it doesn't exist
    /// @dev It is used inside createContentIfNotExists but it should be available to be called alone
    /// @param name Tag name
    /// @param submittedBy user that submitted the tag
    function createTagIfNotExists(
        string memory name,
        address submittedBy
    ) public onlyOwner returns (uint256){
        // check if it is the first tag in the array
        string memory firstTagName = tags.list[0].name;
        if (keccak256(bytes(name)) == keccak256(bytes(firstTagName))){
            return 0;
        }
        // check if tag is already registered
        uint256 index = tags.ids[name];
        if (index == 0){
            // add new tag to array
            Tag memory newTag = Tag(name, submittedBy, new uint256[](0));
            tags.list.push(newTag);
            uint256 newIndex = tags.list.length - 1;
            tags.ids[name] = newIndex;
            return newIndex;
        }
        return index;
    }

    /// @notice Get a user id from array or add a new user if it doesn't exist
    /// @dev It is used inside createContentIfNotExists but it should be available to be called alone
    /// @param userAddress User address
    function createUserIfNotExists(
        address userAddress
    ) public onlyOwner returns (uint256){
        // check if content is the first one in the array
        address firstUserAddress = users.list[0].userAddress;
        if (userAddress == firstUserAddress){
            return 0;
        }
        // check if user is already registered
        uint256 index = users.ids[userAddress];
        if (index == 0){
            // add new user to array
            User memory newUser = User(userAddress, 0, new uint256[](0));
            users.list.push(newUser);
            uint256 newIndex = users.list.length - 1;
            users.ids[userAddress] = newIndex;
            return newIndex;
        }
        return index;
    }

    /// @notice Sync Content state with the backend. Only Content, Tag and User elements that have been updated
    /// @dev It can be called only by the backend to sync the state of the URLs
    function syncState(
        User[] calldata usersToAdd,
        TagToAdd[] calldata tagsToAdd,
        ContentToAdd[] calldata contentsToAdd
    ) public onlyOwner {
        for (uint256 i = 0; i < usersToAdd.length; i++) {
            uint256 userIndex = createUserIfNotExists(
                usersToAdd[i].userAddress
            );
            users.list[userIndex].numberOfLikedContent = usersToAdd[i].numberOfLikedContent;
            users.list[userIndex].submittedContent = usersToAdd[i].submittedContent;
        }
        for (uint256 i = 0; i < tagsToAdd.length; i++) {
            createTagIfNotExists(
                tagsToAdd[i].name,
                tagsToAdd[i].createdBy
            );
        }
        for (uint256 i = 0; i < contentsToAdd.length; i++) {
            createContentIfNotExists(
                contentsToAdd[i].title,
                contentsToAdd[i].url,
                contentsToAdd[i].submittedBy,
                contentsToAdd[i].likes,
                contentsToAdd[i].tagIds
            );
        }
    }
}