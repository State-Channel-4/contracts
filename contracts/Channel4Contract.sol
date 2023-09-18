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
        string memory tag,
        uint256 slashingFee,
        uint256 backendRegistrationFee
    )
    Data(title, url, tag)
    Create()
    Interact()
    Litigate(slashingFee, backendRegistrationFee)
    {}

    /// @notice Sync Content state with the backend. Only Content, Tag and User elements that have been updated
    /// @dev It can be called only by the backend to sync the state of the URLs
    /// @param usersToAdd - addresses of new users to enroll in the contract
    /// @param tagsToAdd - tags to add to the contract
    /// @param contentsToAdd - url contents to add to the contract
    /// @param pendingActions - pending like/unlike actions to facilitate
    function syncState(
        address[] calldata usersToAdd,
        TagToSync[] calldata tagsToAdd,
        ContentToSync[] calldata contentsToAdd,
        Pending[] calldata pendingActions
    ) public onlyBackend {
        for (uint256 i = 0; i < usersToAdd.length; i++)
            _createUserIfNotExists(usersToAdd[i]);
        for (uint256 i = 0; i < tagsToAdd.length; i++) {
            _createTagIfNotExists(
                tagsToAdd[i].name,
                tagsToAdd[i].createdBy
            );
        }
        for (uint256 i = 0; i < contentsToAdd.length; i++) {
            _createContentIfNotExists(
                contentsToAdd[i].title,
                contentsToAdd[i].url,
                contentsToAdd[i].submittedBy,
                0,
                contentsToAdd[i].tagIds
            );
        }
        for (uint i = 0; i < pendingActions.length; i++) {
            toggleLike(pendingActions[i].url, pendingActions[i].submittedBy);
        }
    }
}