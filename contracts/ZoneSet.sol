pragma solidity ^0.4.15;


contract ZoneSet {

    mapping(address => string) addressToUrl;

    event UrlUpdated(address indexed sender, string newUrl);

    function updateUrl(string newUrl) {
        addressToUrl[msg.sender] = newUrl;
        UrlUpdated(msg.sender, newUrl);
    }


    function addressHasUrl(address lookupAddr) constant returns (bool) {
        return bytes(addressToUrl[lookupAddr]).length != 0;
    }


    function urlForAddress(address lookupAddr) constant returns (string) {
        return addressToUrl[lookupAddr];
    }


    function senderAsString() returns (bytes) {
        bytes memory b = new bytes(20);
        for (uint i = 0; i < 20; i++) {
            b[i] = byte(uint8(uint(msg.sender) / (2**(8*(19 - i)))));
        }
        return b;
    }

    function () {
        revert();
    }
 }