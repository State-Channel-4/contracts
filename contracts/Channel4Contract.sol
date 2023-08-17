// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Data } from "./Data.sol";
import { Create } from "./Create.sol";
import { Interact } from "./Interact.sol";

import { Litigate } from "./Litigate.sol";

contract Channel4Contract is Data, Create, Interact, Litigate {
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