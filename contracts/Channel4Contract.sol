// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract Channel4Contract is Ownable, EIP712 {
    using ECDSA for bytes32;

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

    struct ContentToAdd {
        string title;
        string url;
        address submittedBy;
        uint256 likes;
        string[] tagIds;
    }

    struct TagToAdd {
        string name;
        address createdBy;
        string[] contentIds;
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
        mapping (address => mapping (uint256 => bool)) likedContent;
    }

    bytes32 private constant CONTENT_TO_ADD_TYPE = keccak256("ContentToAdd(string title,string url,address submittedBy,uint256 likes,string[] tagIds)");
    address private constant BACKEND_ADDRESS = 0xb4a5714dd934a3391Bc670BEc9aee18b821e1Fd5;

    Contents private contents;
    Tags private tags;
    Users private users;

    /// @notice Initialize contract with one tag and one content
    /// @dev Initialize with one element in each list to prevent the mapping of initial tag (0) to be confused as a empty value
    /// @param title First content title
    /// @param url First content link
    /// @param tag First tag name
    constructor (string memory title, string memory url, string memory tag) EIP712("Channel4Contract", "0.0.1") {
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



    /// Ligitation functions

    /// @notice Verify if EIP-712 signature is valid
    /// @dev For EIP-712 in Solidity check https://gist.github.com/markodayan/e05f524b915f129c4f8500df816a369b
    /// @param content Content message
    /// @param signature EIP-712 signature
    function verifyMetaTx(ContentToAdd calldata content, bytes calldata signature) public view returns (address) {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            CONTENT_TO_ADD_TYPE,
            keccak256(bytes(content.title)),
            keccak256(bytes(content.url)),
            content.submittedBy,
            keccak256(abi.encode(content.likes)),
            keccak256(abi.encode(content.tagIds))
        )));
        address signer = ECDSA.recover(digest, signature);
        return signer;
    }

    /// @notice Litigate a specific content (add it and claim slashing)
    /// @dev For more info about verifying EIP-712 check https://github.com/aglawson/Meta-Transactions/blob/main/contracts/MinimalForwarder.sol
    /// @param content Content to litigate
    /// @param signature EIP-712 signature
    function litigateContent(
        ContentToAdd calldata content,
        bytes calldata signature
    ) public view returns (address) {
        require(bytes(signature).length > 0, "Signature required");
        //require( verifyMetaTx(content, signature), "Invalid signature");
        return verifyMetaTx(content, signature);
        // TODO: check if content is already registered
        // TODO: if so return false

        // TODO: add content to state
        // TODO: slash backend
        //return true;
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
            if (users.likedContent[userAddress][i] == true){
                result[resultIndex] = contents.list[i];
                resultIndex++;
            }
        }
        return result;
    }
}