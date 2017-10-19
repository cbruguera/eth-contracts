pragma solidity ^0.4.15;

contract Destroyable {
    address private owner;

    function Destroyable() public { owner = msg.sender; }
    
    function destroy() public { 
        require (msg.sender == owner);
        selfdestruct(owner); 
    }
}
