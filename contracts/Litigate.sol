// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Data } from "./Data.sol";
import { Create } from "./Create.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

abstract contract Litigate is Data, Create, EIP712 {

    bytes32 private constant CONTENT_TO_ADD_TYPE = keccak256("ContentToAdd(string title,string url,address submittedBy,uint256 likes,string[] tagIds)");

    address private backendAddress;
    uint256 private backendVault = 0;
    uint256 private constant SLASHING_FEE = 0.001 ether;
    uint256 private constant BACKEND_REGISTRATION_FEE = 0.01 ether;

    constructor() EIP712("Channel4Contract", "0.0.1") {}

    /// Registration functions

    /// @notice Register a backend address
    /// @dev Backend address must pay 1 ether to register. It will get slashed if does not include content correctly
    function registerBackend() public payable {
        require(msg.value >= BACKEND_REGISTRATION_FEE, "Backend registration fee is 1 ether");
        require(backendAddress != msg.sender, "Backend address already registered");
        backendAddress = msg.sender;
        backendVault = backendVault + msg.value;
    }

    /// @notice Recharge backend vault
    function rechargeVault() public payable {
        require(backendAddress == msg.sender, "Only backend can recharge vault");
        backendVault = backendVault + msg.value;
    }

    /// @notice Slash backend = send funds to litigator and reduce vault
    /// @dev This function can only be called inside this contract
    /// @param litigator Litigator address (user who called the litigate function)
    function slashBackend(address litigator) private {
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



    /// Ligitation functions

    /// @notice Verify if EIP-712 signature is valid
    /// @dev For EIP-712 in Solidity check https://gist.github.com/markodayan/e05f524b915f129c4f8500df816a369b
    /// @param content Content message
    /// @param signature EIP-712 signature
    function verifyMetaTx(ContentToAdd calldata content, bytes calldata signature) public view returns (bool) {
        bytes32[] memory encodedTagIds = new bytes32[](content.tagIds.length);
        for (uint256 i = 0; i < content.tagIds.length; i++) {
            encodedTagIds[i] = keccak256(bytes(content.tagIds[i]));
        }

        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            CONTENT_TO_ADD_TYPE,
            keccak256(bytes(content.title)),
            keccak256(bytes(content.url)),
            content.submittedBy,
            content.likes,
            keccak256(abi.encodePacked( encodedTagIds ))
        )));
        address signer = ECDSA.recover(digest, signature);
        return signer == backendAddress;
    }

    /// @notice Litigate a specific content (add it and claim slashing)
    /// @dev For more info about verifying EIP-712 check https://github.com/aglawson/Meta-Transactions/blob/main/contracts/MinimalForwarder.sol
    /// @param content Content to litigate
    /// @param signature EIP-712 signature
    function litigateContent(
        ContentToAdd calldata content,
        bytes calldata signature
    ) public returns (string memory) {
        require( verifyMetaTx(content, signature), "Invalid signature");
        // check if content is already registered
        string memory firstUrl = contents.list[0].url;
        require( keccak256(bytes(content.url)) != keccak256(bytes(firstUrl)), "Initial content is not litigable" );
        uint256 contentIndex = contents.ids[content.url];
        if (contentIndex != 0){
            // content exists, check if constant values are correct
            Content memory existingContent = contents.list[contentIndex];
            bool isTitleCorrect = keccak256(bytes(content.title)) == keccak256(bytes(existingContent.title));
            bool isSubmittedByCorrect = content.submittedBy == existingContent.submittedBy;
            bool isTagIdsCorrect = content.tagIds.length == existingContent.tagIds.length;
            bool isTagNameCorrect = false;
            if (isTagIdsCorrect){
                for (uint256 i = 0; i < content.tagIds.length; i++) {
                    isTagNameCorrect = keccak256(bytes(content.tagIds[i])) == keccak256(bytes(tags.list[existingContent.tagIds[i]].name));
                    isTagIdsCorrect = isTagIdsCorrect && isTagNameCorrect;
                }
            }
            // if Content values are correct return true
            if (isTitleCorrect && isSubmittedByCorrect && isTagIdsCorrect){
                return "Content is correct";
            }
        }
        // content does not exists or values are incorrect, add it
        createContentIfNotExists(
            content.title,
            content.url,
            content.submittedBy,
            content.likes,
            content.tagIds
        );
        // TODO: slash backend
        return "Content does not exist or values are incorrect";
    }
}