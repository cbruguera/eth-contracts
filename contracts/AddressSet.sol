pragma solidity ^0.4.15;

contract AddressSet {

    mapping(address => address) accountToRegistrarMap;

    event AddressAdded(address indexed addr, uint val);
    // event Attempt(uint a, uint b);
    
    function addAddress(address addr) public payable {
        require (msg.value == this.balance);
        require (accountToRegistrarMap[addr] == address(0));

        accountToRegistrarMap[addr] = msg.sender;
        addr.transfer(msg.value); 

        AddressAdded(addr, msg.value); 
    }

    function contains(address addr) public constant returns (bool r) {
       if (accountToRegistrarMap[addr] == address(0)) {
           return false;
       } else {
           return true;
       }
    }

    function () public {
        revert();
    }
 }