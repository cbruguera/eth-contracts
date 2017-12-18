pragma solidity ^0.4.13;

import './DSMath.sol';
import './DoublyLinkedList.sol';
import 'zeppelin-solidity/contracts/token/StandardToken.sol';

contract IcoPassToken is StandardToken, DSMath {

  string public constant name = "IcoPassToken";
  string public constant symbol = "NIP";
  uint8 public constant decimals = 3;
  uint256 public constant INITIAL_SUPPLY = 490000 * (10 ** uint256(decimals));

  uint private totalDeposited = 0;
  // uint private totalWithdrawn = 0;
  // mapping(address => uint) pendingWithdrawal;

  event UnaccountedFor(int256 valu);
  event Transferring(address recipient, uint transfer, uint holderBalance);
  event DividendsDeposited(uint amt);
  event DividendsWithdrawn(address recipient, uint amt);
  event PendingDividendsWithdrawn(address recipient, uint amt);
  event Debug(string yo, uint ttt);

  

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function IcoPassToken(address _treasury) public {
    totalSupply = INITIAL_SUPPLY;
    balances[_treasury] = INITIAL_SUPPLY;
  }

  modifier valueDivisibleBySupply() {
    require(msg.value >= INITIAL_SUPPLY);
    uint valuePerToken = msg.value / INITIAL_SUPPLY;
    uint processableAmount = valuePerToken * INITIAL_SUPPLY;

    Debug("Value per token", valuePerToken);
    Debug("Processable", processableAmount);
    Debug("Msg value", msg.value);
    
    require(processableAmount == msg.value);

    _;
  }

  mapping (address => uint) totalDepositedAtCycleStart;
  mapping (address => uint) pendingDividends;

  function transfer(address _to, uint256 _value) assignsPendingDividendsAndResetCycle(msg.sender) assignsPendingDividendsAndResetCycle(_to) public returns (bool) {
    super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) assignsPendingDividendsAndResetCycle(_from) assignsPendingDividendsAndResetCycle(_to) public returns (bool) {
    super.transferFrom(_from, _to, _value);
  }

  // modifier updateAccount(address subject) {

  // }

  // modifier updateSender(address subject) {

  // }

  function withdrawDividends() public assignsPendingDividendsAndResetCycle(msg.sender) withdrawPending(msg.sender) {}
  
  // modifier withdrawsPending(address holder) {
  //   uint pendingAmount = owedToHolder(holder);
  //   totalWithdrawnInclPending += pendingAmount;
  //   pendingWithdrawal[holder] = pendingAmount;

  //   PendingDividendsWithdrawn(holder, pendingAmount);

  //   _;
  // }

  modifier withdrawPending(address holder) {
    uint owed = pendingDividends[holder];
    if (owed > 0) {
      holder.transfer(owed);
      pendingDividends[holder] = 0;

      DividendsWithdrawn(holder, owed);
    }

    _;
  }

  modifier assignsPendingDividendsAndResetCycle(address holder) {
    uint owed = owedToHolder(holder);
    pendingDividends[holder] += owed;

    totalDepositedAtCycleStart[holder] = totalDeposited;

    _;
  }

  function owedToHolder(address holder) internal constant returns (uint) {
    uint tokenBalance = balances[holder];
    uint accumulatedDividendsDuringCycle = totalDeposited -  totalDepositedAtCycleStart[holder];

    uint holderShare = wdiv(tokenBalance, INITIAL_SUPPLY);
    uint holderValue = wmul(accumulatedDividendsDuringCycle, holderShare);

    return holderValue;
  }

  function depositDividends() public payable valueDivisibleBySupply() {
    DividendsDeposited(msg.value);
    totalDeposited += msg.value;
  }

  function () {
    revert();
  }

}