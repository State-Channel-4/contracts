// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract Channel4Contract is Ownable {

    struct Content {
        string title;
        string url;
        address submittedBy;
        uint256 likes;
        uint256[] tagIds;
    }

    struct Tag {
        string name;
        address createdBy;
        uint256[] contentIds;
    }

    struct User {
        mapping (uint256 => bool) likedContent;
        uint256 numberOfLikedContent;
        uint256[] submittedContent;
    }

    struct Contents {
        Content[] list;
        mapping (string => uint256) ids;
    }

    struct Tags {
        Tag[] list;
        mapping (string => uint256) ids;
    }

    Contents private contents;
    Tags private tags;
    mapping (address => User) private users;

    /// Creation functions

    /// @notice Save URL in smart contract. Create tags if they don't exist
    /// @dev The function flow is: get url id, create tags (and save url id), save url
    /// @param title content title
    /// @param url content link. It works as an id as well because it is unique
    /// @param _tags Tag names list associated with that content
    function createContentIfNotExists(string memory title, string memory url, address submittedBy, uint256 likes, string[] calldata _tags) public returns (uint256) {
        require(bytes(title).length > 0 && bytes(url).length > 0 && _tags.length > 0, "Invalid input");
        // If tx fails then changes rollback. We can be sure content index in the beginning = content index in the end
        uint256 contentIndex = contents.list.length;
        // get tag indexes or create new tags. Also add content index to each tag
        uint256[] memory tagIndexes = new uint256[](_tags.length);
        for (uint256 i = 0; i < _tags.length; i++) {
            tagIndexes[i] = createTagIfNotExists(_tags[i]);
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
            return contentIndex;
        } else {
            // update content
            contents.list[index] = newContent; // TODO: if we do it in parts can we save gas?
            return index;
        }
    }

    /// @notice Get a tag id from array or add a new tag if it doesn't exist
    /// @dev It is used inside createContentIfNotExists but it should be available to be called alone
    /// @param name Tag name
    function createTagIfNotExists(string memory name) public returns (uint256){
        // check if it is the first tag in the array
        string memory firstTagName = tags.list[0].name;
        if (keccak256(bytes(name)) == keccak256(bytes(firstTagName))){
            return 0;
        }
        // check if tag is already registered
        uint256 index = tags.ids[name];
        if (index == 0){
            // add new tag to array
            Tag memory newTag = Tag(name, msg.sender, new uint256[](0));
            tags.list.push(newTag);
            uint256 newIndex = tags.list.length - 1;
            tags.ids[name] = newIndex;
            return newIndex;
        }
        return index;
    }

    /// @notice Sync URLs state with the backend
    /// @dev It can be called only by the backend to sync the state of the URLs
    function syncState() public onlyOwner {
        // TODO: implement function
    }


    /// Interaction functions

    /// @notice Like a specific content
    /// @param index Content id
    function likeContent(uint256 index) public {
        address userAddress = msg.sender;
        require(users[userAddress].likedContent[index] == false, "Content already liked");
        users[userAddress].numberOfLikedContent = users[userAddress].numberOfLikedContent + 1;
        users[userAddress].likedContent[index] = true;
        contents.list[index].likes = contents.list[index].likes + 1;
    }

    /// @notice Unlike a specific URL
    /// @param index URL id
    function unlikeContent(uint256 index) public {
        address userAddress = msg.sender;
        require(users[userAddress].likedContent[index] == true, "Content already unliked");
        users[userAddress].numberOfLikedContent = users[userAddress].numberOfLikedContent - 1;
        users[userAddress].likedContent[index] = false;
        contents.list[index].likes = contents.list[index].likes - 1;
    }


    /// Reading functions

    /// @notice Retrieve all contents associated with a specific tag name
    /// @param name Tag name
    function getContentByTag(string memory name) public view returns (Content[] memory) {
        // check that the tag exists
        uint256 index = tags.ids[name];
        require(index != 0, "Tag not found");

        uint256[] memory contentIds =  tags.list[index].contentIds;
        uint256 length = contentIds.length;
        Content[] memory result = new Content[](length);
        for (uint256 i =0; i < length; i ++){
            result[i] = contents.list[contentIds[i]];
        }
        return result;
    }

    /// @notice Retrieve all registered contents
    function getAllContent() public view returns (Content[] memory) {
        return contents.list;
    }

    /// @notice Retrieve all registered tags
    function getAllTags() public view returns (Tag[] memory) {
        return tags.list;
    }

    /// @notice Get a specific Content
    /// @param index Content id
    function getContent(uint256 index) public view returns (Content memory) {
        require(index < contents.list.length, "Invalid URL index");
        return contents.list[index];
    }

    /// @notice Get a specific tag
    /// @param index Tag id
    function getTag(uint256 index) public view returns (Tag memory) {
        require(index < tags.list.length, "Invalid Tag index");
        return tags.list[index];
    }

    /// @notice Retrieve all content submitted by a specific user
    /// @param userAddress User id
    function getUserSubmittedContent(address userAddress) public view returns (Content[] memory) {
        uint256[] memory userSubmittedContent = users[userAddress].submittedContent;
        uint256 length = userSubmittedContent.length;
        Content[] memory result = new Content[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = contents.list[userSubmittedContent[i]];
        }
        return result;
    }

    /// @notice Get all liked content of a specific user
    /// @param userAddress User id
    function getUserLikedContent(address userAddress) public view returns (Content[] memory) {
        // get the actual likedURLs
        Content [] memory result = new Content[](users[userAddress].numberOfLikedContent);
        for (uint256 i = 0; i < contents.list.length; i++) {
            if (users[userAddress].likedContent[i] == true){
                result[i] = contents.list[i];
            }
        }
        return result;
    }
}