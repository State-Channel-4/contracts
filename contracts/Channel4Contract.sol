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
            addContentToTag(tagIndexes[i], contentIndex);
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
    /// @dev It is used inside submitURL but it should be available to be called alone
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

    /// @notice Save content id in tag object so it is easily retrievable later
    /// @dev It is an internal function used inside createContentIfNotExists
    function addContentToTag(uint256 tagIndex, uint256 contentIndex) internal {
        tags.list[tagIndex].contentIds.push(contentIndex);
    }


    /// @notice Sync URLs state with the backend
    /// @dev It can be called only by the backend to sync the state of the URLs
    function syncState() public onlyOwner {
        // TODO: implement function
    }

}