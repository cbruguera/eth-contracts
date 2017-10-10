pragma solidity ^0.4.11;

contract AddressSet {

    mapping(address => address) accountToRegistrarMap;

    event AddressAdded(address indexed addr);
    // event Attempt(uint a, uint b);
    
    function AddressSet() {
    }

    function addAddress(address addr) payable {
        // need to fund the added address with at
        // least the amount this tx cost
        require (msg.value >= tx.gasprice * msg.gas);
        
        // // address must not have been registered already
        require (accountToRegistrarMap[addr] == address(0));

        accountToRegistrarMap[addr] = msg.sender;
        addr.transfer(msg.value); //x2 (50k)

        AddressAdded(addr); // 2.2k
    }

    function contains(address addr) returns (bool r) {
       if (accountToRegistrarMap[addr] == address(0)) {
           return false;
       } else {
           return true;
       }
    }

    function () {
        revert();
    }
 }