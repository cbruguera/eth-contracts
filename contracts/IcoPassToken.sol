pragma solidity ^0.4.13;

import './DSMath.sol';
import 'zeppelin-solidity/contracts/token/StandardToken.sol';

contract IcoPassToken is StandardToken, DSMath {

  string public constant name = "IcoPassToken";
  string public constant symbol = "NIP";
  uint8 public constant decimals = 3;

  uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  address[] private holders;

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function IcoPassToken(address _treasury) public {
    totalSupply = INITIAL_SUPPLY;
    balances[_treasury] = INITIAL_SUPPLY;
  }

  function distributeAmongHolders() payable {
    require(msg.value > 0);
    uint accountedFor = 0;

    for (uint i = 0; i < holders.length; ++i) {
      address holder = holders[i];
      uint holderBalance = balances[holder];
      uint holderShare = wdiv(holderBalance, INITIAL_SUPPLY);
      uint holderValue = wmul(msg.value, holderShare);
      accountedFor += holderValue;
      holder.transfer(holderValue);
    }

    require(accountedFor == msg.value);
  }

}