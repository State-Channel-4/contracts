// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


abstract contract OnlyBackend {
    address public backendAddress;

    // Check functions

    modifier onlyBackend() {
        _checkBackend();
        _;
    }

    function _checkBackend() internal view {
        require(backendAddress == msg.sender, "Caller is not the backend");
    }
}