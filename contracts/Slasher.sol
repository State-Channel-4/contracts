// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Data } from "./Data.sol";
import { Create } from "./Create.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

abstract contract Slasher {

    address public backendAddress;
    uint256 public backendVault = 0;
    uint256 private SLASHING_FEE = 0.001 ether;
    uint256 private BACKEND_REGISTRATION_FEE = 0.01 ether;

    constructor (uint256 slashingFee, uint256 backendRegistrationFee) {
        SLASHING_FEE = slashingFee;
        BACKEND_REGISTRATION_FEE = backendRegistrationFee;
    }

    /// Registration functions

    /// @notice Register a backend address
    /// @dev Backend address must pay 1 ether to register. It will get slashed if does not include content correctly
    function registerBackend() public payable {
        require(msg.value >= BACKEND_REGISTRATION_FEE, "Backend registration fee is 1 ether");
        require(backendVault <= 2*SLASHING_FEE, "Backend vault is full. No backend can be registered");
        backendAddress = msg.sender;
        backendVault = backendVault + msg.value;
    }

    /// @notice Recharge backend vault
    /// @dev If vault is low enough, anyone can remove the backend address
    function rechargeVault() public payable {
        require(backendAddress == msg.sender, "Only backend can recharge vault");
        backendVault = backendVault + msg.value;
    }

    /// @notice Slash backend = send funds to litigator and reduce vault
    /// @dev This function can only be called inside this contract
    /// @param litigator Litigator address (user who called the litigate function)
    function slashBackend(address litigator) internal {
        require(backendVault >= SLASHING_FEE, "Backend vault is empty");
        backendVault = backendVault - SLASHING_FEE;
        (bool success, ) = litigator.call{ value:SLASHING_FEE }("");
        require(success, "Transfer to litigator failed.");
    }

    /// @notice Remove backend address and withdraw vault
    /// @dev it only can be called if vault is less than double the slashing fee
    function removeBackend() public {
        require(backendVault <= 2*SLASHING_FEE, "Backend vault is not qualified to be removed");
        uint256 remainingVault = backendVault;
        backendVault = 0;
        backendAddress = address(0);
        (bool success, ) = backendAddress.call{ value:remainingVault }("");
        require(success, "Transfer to backend failed.");
    }
}