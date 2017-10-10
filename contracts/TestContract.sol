pragma solidity ^0.4.4;

contract TestContract {

    int _multiplier;
    event Multiplied(int indexed a, address indexed sender, int result );

    function TestContract(int multiplier) {
        _multiplier = multiplier;
    }

    function multiply(int a) returns (int r) {
       r = a * _multiplier;
       Multiplied(a, msg.sender, r);
       return r;
    }
 }