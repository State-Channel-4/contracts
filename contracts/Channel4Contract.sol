// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Data } from "./Data.sol";
import { Create } from "./Create.sol";
import { Interact } from "./Interact.sol";

import { Litigate } from "./Litigate.sol";

contract Channel4Contract is Data, Create, Interact, Litigate {

    /// @notice Initialize contract with one tag and one content
    /// @dev Initialize with one element in each list to prevent the mapping of initial tag (0) to be confused as a empty value
    /// @param title First content title
    /// @param url First content link
    /// @param tag First tag name
    constructor (
        string memory title,
        string memory url,
        string memory tag
    )
    Data(title, url, tag)
    Create()
    Interact()
    Litigate()
    {}
}