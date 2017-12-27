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

    // 0 means 'unset', so ensure 0 index points to an invalid address
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
  }

  function ensureHolderPurged(address holder) public {
    require(holder != 0x0);

    uint ix = holderIndices[holder];
    if (ix == 0) { return; }

    delete holders[ix];
    holderIndices[holder] = 0;
    holderCount -= 1;
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

  function distributeAmongHolders() public payable {
    require(msg.value > 0);

    uint accountedFor = 0;
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
    
      holder.transfer(holderValue);
      Transferring(holder, holderValue, balances[holder]);
    }

    require(int(msg.value) - int(accountedFor) == 0);
  }

}