pragma solidity ^0.4.18;


import '../../contracts/IcoPassToken.sol';


contract IcoPassTokenMock is IcoPassToken {

  function IcoPassTokenMock(address initialAccount, uint256 initialBalance) public {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

}