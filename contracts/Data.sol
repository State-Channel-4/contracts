// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

abstract contract Data {

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
        address userAddress;
        uint256 numberOfLikedContent;
        uint256[] submittedContent;
    }

    struct Like {
        uint256 nonce;
        bool liked;
    }

    struct ContentToAdd {
        string title;
        string url;
        address submittedBy;
        uint256 likes;
        string[] tagIds;
    }

    struct ContentToSync {
        string title;
        string url;
        address submittedBy;
        string[] tagIds;
    }

    struct TagToAdd {
        string name;
        address createdBy;
        string[] contentIds;
    }

    struct TagToSync {
        string name;
        address createdBy;
    }

    struct LikeToVerify {
        string title;
        address likedBy;
    }

    struct Contents {
        Content[] list;
        mapping (string => uint256) ids;
    }

    struct Tags {
        Tag[] list;
        mapping (string => uint256) ids;
    }

    struct Users {
        User[] list;
        mapping (address => uint256) ids;
        mapping (address => mapping (uint256 => Like)) likedContent;
    }

    struct Pending {
        address submittedBy;
        string url;
        bool liked;
    }

    Contents contents;
    Tags tags;
    Users users;

    /// @notice Initialize contract with one tag and one content
    /// @dev Initialize with one element in each list to prevent
    /// the mapping of initial tag (0) to be confused as a empty value
    /// @param title First content title
    /// @param url First content link
    /// @param tag First tag name
    constructor (string memory title, string memory url, string memory tag) {
        address msgSender = msg.sender;

        Tag memory firstTag = Tag(tag, msgSender, new uint256[](0));
        tags.list.push(firstTag);
        tags.list[0].contentIds.push(0);

        Content memory firstContent = Content(title, url, msgSender, 0, new uint256[](0));
        contents.list.push(firstContent);
        contents.list[0].tagIds.push(0);

        User memory newUser = User(msgSender, 0, new uint256[](0));
        users.list.push(newUser);
        users.list[0].submittedContent.push(0);
        users.ids[msgSender] = 0;
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

    /// @notice Retrieve all registered users
    function getAllUsers() public view returns (User[] memory) {
        return users.list;
    }

    /// @notice Get a specific Content
    /// @param url Content url (works as an id)
    function getContent(string memory url) public view returns (Content memory) {
        uint256 index = contents.ids[url];
        require(index < contents.list.length, "Invalid Content index");
        return contents.list[index];
    }

    /// @notice Get a specific tag
    /// @param name tag name
    function getTag(string memory name) public view returns (Tag memory) {
        uint256 index = tags.ids[name];
        require(index < tags.list.length, "Invalid Tag index");
        return tags.list[index];
    }

    /// @notice Get a specific user
    /// @param userAddress user address
    function getUser(address userAddress) public view returns (User memory) {
        uint256 index = users.ids[userAddress];
        require(index < tags.list.length, "Invalid User index");
        return users.list[index];
    }

    /// @notice Retrieve all content submitted by a specific user
    /// @param userAddress User id
    function getUserSubmittedContent(address userAddress) public view returns (Content[] memory) {
        uint256 userIndex = users.ids[userAddress];
        uint256[] memory userSubmittedContent = users.list[userIndex].submittedContent;
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
        uint256 userIndex = users.ids[userAddress];
        uint256 resultIndex = 0;
        Content [] memory result = new Content[](users.list[userIndex].numberOfLikedContent);
        for (uint256 i = 0; i < contents.list.length; i++) {
            if (users.likedContent[userAddress][i].liked == true){
                result[resultIndex] = contents.list[i];
                resultIndex++;
            }
        }
        return result;
    }
}