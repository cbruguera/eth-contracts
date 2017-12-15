pragma solidity ^0.4.13;

import './DSMath.sol';
import './DoublyLinkedList.sol';
import 'zeppelin-solidity/contracts/token/StandardToken.sol';

contract IcoPassToken is StandardToken, DSMath {

  string public constant name = "IcoPassToken";
  string public constant symbol = "NIP";
  uint8 public constant decimals = 3;

  uint256 public constant INITIAL_SUPPLY = 490000 * (10 ** uint256(decimals));

  event UnaccountedFor(int256 valu);
  event Transferring(address recipient, uint transfer, uint holderBalance);
  event GotDividends(uint amt);
  event Debug(string yo, uint ttt);

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function IcoPassToken(address _treasury) public {
    totalSupply = INITIAL_SUPPLY;
    balances[_treasury] = INITIAL_SUPPLY;
  }

  modifier valueDivisibleBySupply() {
    require(msg.value > INITIAL_SUPPLY);
    uint valuePerToken = msg.value / INITIAL_SUPPLY;
    uint processableAmount = valuePerToken * INITIAL_SUPPLY;

    Debug("Value per token", valuePerToken);
    Debug("Processable", processableAmount);
    Debug("Msg value", msg.value);
    
    require(processableAmount == msg.value);

    _;
  }

  // modifier updateAccount(address subject) {

  // }

  // modifier updateSender(address subject) {

  // }

  function withdrawDividends() {

  }

  function depositDividends() public payable valueDivisibleBySupply() {
    Debug("Msg value (in)", msg.value);
    
    // uint accountedFor = 0;
    // uint remainingSends = 2;

    // GotDividends(msg.value);

    // for (uint i = 0; i < holders.length; ++i) {
    //   address holder = holders[i];
    //   if (holder == 0x0) { continue; }
      
    //   uint ix = holderIndices[holder];
    //   if (ix == 0) { continue; }

    //   uint holderBalance = balances[holder];

    //   uint holderShare = wdiv(holderBalance, INITIAL_SUPPLY);
    //   uint holderValue = wmul(msg.value, holderShare);
    //   accountedFor += holderValue;
    
    //   holder.transfer(holderValue);
    //   Transferring(holder, holderValue, balances[holder]);
    // }

    // require(int(msg.value) - int(accountedFor) == 0);
  }

}