// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Data } from "./Data.sol";
import { Create } from "./Create.sol";
import { Interact } from "./Interact.sol";
import { Litigate } from "./Litigate.sol";
import { Rewards } from "./Rewards.sol";


struct ConstructorObj {
    string title;
    string url;
    string tag;
    uint256 slashingFee;
    uint256 backendRegistrationFee;
    uint256 timeThreshold;
    uint256 registrationThreshold;
    uint256 likesInPeriodThreshold;
    uint256 rewardsAmount;
}

contract Channel4Contract is Data, Create, Interact, Litigate, Rewards {
    constructor (
        ConstructorObj memory constructorObj
    )
    Data(
        constructorObj.title,
        constructorObj.url,
        constructorObj.tag
    )
    Create()
    Interact()
    Litigate(
        constructorObj.slashingFee,
        constructorObj.backendRegistrationFee,
        constructorObj.timeThreshold
    )
    Rewards(
        constructorObj.registrationThreshold,
        constructorObj.likesInPeriodThreshold,
        constructorObj.rewardsAmount
    )
    {}

    /// @notice Sync Content state with the backend. Only Content, Tag and User elements that have been updated
    /// @dev It can be called only by the backend to sync the state of the URLs
    /// @param usersToSync - users to enroll/update in the contract
    /// @param tagsToAdd - tags to add to the contract
    /// @param contentsToAdd - url contents to add to the contract
    /// @param pendingActions - pending like/unlike actions to facilitate
    function syncState(
        User[] calldata usersToSync,
        TagToSync[] calldata tagsToAdd,
        ContentToSync[] calldata contentsToAdd,
        Pending[] calldata pendingActions
    ) public onlyBackend {
        for (uint256 i = 0; i < usersToSync.length; i++) {
            _createUserIfNotExists(usersToSync[i]);
        }
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
            _toggleLike(
                pendingActions[i].url,
                pendingActions[i].liked,
                pendingActions[i].nonce,
                pendingActions[i].submittedBy
            );
        }
    }
}