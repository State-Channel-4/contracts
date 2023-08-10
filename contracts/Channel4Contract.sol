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

}