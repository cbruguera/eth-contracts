pragma solidity ^0.4.15;

contract TestThrowProxy {

    address public target;
    bytes data;

    function TestThrowProxy(address _target) {
        target = _target;
    }    

    //prime the data using the fallback function.
    function() {
        data = msg.data;
    }
    
    function execute() returns (bool) {
        return target.call(data);
    }
}