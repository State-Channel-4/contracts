// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Data } from "./Data.sol";
import { OnlyBackend } from "./OnlyBackend.sol";

abstract contract Rewards is Data, OnlyBackend {

    uint256 public rewardsVault = 0;

    uint256 public lastMonth = 0;

    uint256 private REGISTRATION_THRESHOLD = 1 days;

    uint256 private LIKES_IN_PERIOD_THRESHOLD = 10;

    uint256 private REWARDS_AMOUNT = 0.001 ether;


    constructor(uint256 registrationThreshod, uint256 likesInPeriodThreshold, uint256 rewardsAmount) {
        REGISTRATION_THRESHOLD = registrationThreshod;
        LIKES_IN_PERIOD_THRESHOLD = likesInPeriodThreshold;
        REWARDS_AMOUNT = rewardsAmount;
        lastMonth = block.timestamp;
    }

    function withdrawRewards() public {
        require(rewardsVault > 0, "Rewards vault is empty");
        uint256 userIndex = users.ids[msg.sender];
        User memory user = users.list[userIndex];
        require(user.registeredAt > block.timestamp + REGISTRATION_THRESHOLD, "User is not registered");
        require(user.numberOfLikesInPeriod > LIKES_IN_PERIOD_THRESHOLD, "User has not enough likes in period");
        require(block.timestamp > lastMonth + 30 days, "It is not time to withdraw rewards yet");
        // update the last month if 3 days have passed since last month
        if (block.timestamp > lastMonth + 33 days) {
            lastMonth = block.timestamp;
        }
        rewardsVault = rewardsVault - REWARDS_AMOUNT;
        (bool success, ) = user.userAddress.call{ value: REWARDS_AMOUNT }("");
        require(success, "Transfer to user failed.");
    }

    function receiveDonations() payable public {
        rewardsVault = rewardsVault + msg.value;
    }

    function withdrawRemainingRewards() public onlyBackend {
        require(rewardsVault > 0, "Rewards vault is empty");
        uint256 valueToSend = rewardsVault;
        rewardsVault = 0;
        (bool success, ) = backendAddress.call{ value: valueToSend }("");
        require(success, "Transfer to backend failed.");
    }
}