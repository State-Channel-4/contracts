// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Data } from "./Data.sol";
import { OnlyBackend } from "./OnlyBackend.sol";

abstract contract Create is Data, OnlyBackend {
    /// Creation functions

    /// @notice Save URL in smart contract. Create tags if they don't exist
    /// @dev The function flow is: get url id, create tags (and save url id), save url
    /// @dev This function can only be called by the contract or its dependencies
    /// @param title content title
    /// @param url content link. It works as an id as well because it is unique
    /// @param _tags Tag names list associated with that content
    function _createContentIfNotExists(
        string memory title,
        string memory url,
        address submittedBy,
        uint256 likes,
        string[] calldata _tags
    ) internal returns (uint256) {
        require(bytes(title).length > 0 && bytes(url).length > 0 && _tags.length > 0, "Invalid input");
        uint256 userIndex = users.ids[submittedBy];

        // If tx fails then changes rollback. We can be sure content index in the beginning = content index in the end
        uint256 contentIndex = contents.list.length;
        // get tag indexes or create new tags. Also add content index to each tag
        uint256[] memory tagIndexes = new uint256[](_tags.length);
        for (uint256 i = 0; i < _tags.length; i++) {
            tagIndexes[i] = _createTagIfNotExists(_tags[i], submittedBy);
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
    /// @notice wrapper for createContentIfNotExists
    /// @dev this function can only be called by the backend
    function createContentIfNotExists(
        string memory title,
        string memory url,
        address submittedBy,
        uint256 likes,
        string[] calldata _tags
    ) public onlyBackend returns (uint256) {
        return _createContentIfNotExists(title, url, submittedBy, likes, _tags);
    }

    /// @notice Get a tag id from array or add a new tag if it doesn't exist
    /// @dev It is used inside createContentIfNotExists but it should be available to be called alone
    /// @dev This function can only be called by the contract or its dependencies
    /// @param name Tag name
    /// @param submittedBy user that submitted the tag
    function _createTagIfNotExists(
        string memory name,
        address submittedBy
    ) internal returns (uint256){
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
    /// @notice wrapper for createContentIfNotExists
    /// @dev this function can only be called by the backend
    function createTagIfNotExists(
        string memory name,
        address submittedBy
    ) public onlyBackend returns (uint256) {
        return _createTagIfNotExists(name, submittedBy);
    }

    /// @notice Get a user id from array or add a new user if it doesn't exist
    /// @dev It is used inside createContentIfNotExists but it should be available to be called alone
    /// @dev This function can only be called by the contract or its dependencies
    /// @param user User object
    function _createUserIfNotExists(
        User calldata user
    ) internal returns (uint256){
        // check if content is the first one in the array
        address firstUserAddress = users.list[0].userAddress;
        if (user.userAddress == firstUserAddress){
            users.list[0] = user;
            return 0;
        }
        // check if user is already registered
        uint256 index = users.ids[user.userAddress];
        if (index == 0){
            // add new user to array
            User memory newUser = User(user.userAddress, 0, new uint256[](0), block.timestamp, 0);
            users.list.push(newUser);
            uint256 newIndex = users.list.length - 1;
            users.ids[user.userAddress] = newIndex;
            return newIndex;
        }
        users.list[index] = user;
        return index;
    }
    /// @notice wrapper for createContentIfNotExists
    /// @dev this function can only be called by the backend
    function createUserIfNotExists(
        User calldata user
    ) public onlyBackend returns (uint256) {
        return _createUserIfNotExists(user);
    }
}