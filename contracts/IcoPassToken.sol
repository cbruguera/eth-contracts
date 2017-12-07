pragma solidity ^0.4.13;

import './DSMath.sol';
import './DoublyLinkedList.sol';
import 'zeppelin-solidity/contracts/token/StandardToken.sol';

contract IcoPassToken is StandardToken, DSMath {

  string public constant name = "IcoPassToken";
  string public constant symbol = "NIP";
  uint8 public constant decimals = 3;

  uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  event UnaccountedFor(int256 valu);
  event Transferring(address recipient, uint transfer);
  event GotDividends(uint amt);
  
  // using DoublyLinkedList for DoublyLinkedList.data;
  // DoublyLinkedList.data public list;

  // 0 is unset
  address[] holders;
  mapping(address => uint) holderIndices;
  uint holderCount;

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function IcoPassToken(address _treasury) public {
    totalSupply = INITIAL_SUPPLY;
    balances[_treasury] = INITIAL_SUPPLY;

    holders.push(0x0);
    holderIndices[0x0] = 0;

    ensureHolderRegistered(_treasury);
  }

  function ensureHolderRegistered(address holder) public {
    require(holder != 0x0);

    uint ix = holderIndices[holder];
    if (ix != 0) { return; }

    holders.push(holder);
    holderIndices[holder] = holders.length - 1;
    holderCount += 1;

    // var it = list.find(holder);
    // if (!list.iterate_valid(it))
    // {
    //   list.append(holder);
    // }
  }

  function ensureHolderPurged(address holder) public {
    require(holder != 0x0);

    uint ix = holderIndices[0x0];
    if (ix == 0) { return; }

    delete holders[ix];
    holderIndices[holder] = 0;
    holderCount -= 1;
    
    // var it = list.find(holder);
    // if (list.iterate_valid(it))
    // {
    //   list.remove(it);
    // }
  }

  function transfer(address _to, uint256 _value) public returns (bool) {
    super.transfer(_to, _value);
    
    updateHolderRegistration(msg.sender);
    updateHolderRegistration(_to);
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    super.transferFrom(_from, _to, _value);
    
    updateHolderRegistration(_from);
    updateHolderRegistration(_to);
  }

  function updateHolderRegistration(address _holder) internal {
    if (balances[_holder] > 0) { ensureHolderRegistered(_holder); }
    if (balances[_holder] <= 0) { ensureHolderPurged(_holder); }
  }

  function distributeAmongHolders() payable {
    require(msg.value > 0);

    uint accountedFor = 0;
    uint remainingSends = 2;

    GotDividends(msg.value);

    for (uint i = 0; i < holders.length; ++i) {
      address holder = holders[i];
      if (holder == 0x0) { continue; }
      
      uint ix = holderIndices[holder];
      if (ix == 0) { continue; }

      uint holderBalance = balances[holder];
      
      uint holderShare = wdiv(holderBalance, INITIAL_SUPPLY);
      uint holderValue = wmul(msg.value, holderShare);
      accountedFor += holderValue;
    
      // Transferring(holder, holderValue);
      holder.transfer(holderValue);
    }

    // var it = list.iterate_start();
    // while (list.iterate_valid(it)) {
    //     address holder = list.iterate_get(it);
            
    //     uint holderBalance = balances[holder];
    //     uint holderShare = wdiv(holderBalance, INITIAL_SUPPLY);
    //     uint holderValue = wmul(msg.value, holderShare);
    //     accountedFor += holderValue;
    //     // holder.transfer(holderValue);
        
    //     it = list.iterate_next(it);
    // }
    
    // we might have 1 wei unaccounted for on account of rounding
    require(int(msg.value) - int(accountedFor) == 0);
    // UnaccountedFor(int(msg.value) - int(accountedFor));
    
    // return the remainder to sender
    // msg.sender.transfer(msg.value - accountedFor);
  }

}