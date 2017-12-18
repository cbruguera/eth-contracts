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

  event UnaccountedFor(int256 valu);
  event Transferring(address recipient, uint transfer, uint holderBalance);
  event GotDividends(uint amt);
  event Debug(string yo, uint ttt);

  mapping (address => uint) totalWithdrawn;

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

  function transfer(address _to, uint256 _value) public returns (bool) {
    super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    super.transferFrom(_from, _to, _value);
  }

  // modifier updateAccount(address subject) {

  // }

  // modifier updateSender(address subject) {

  // }

  function withdrawDividends() public withdraws(msg.sender) {}
  
  modifier withdraws(address holder) {
    uint owed = owedToHolder(holder);
    holder.transfer(owed);
    Transferring(holder, owed, balances[holder]);

    _;
  }

  function owedToHolder(address holder) internal constant returns (uint) {
    uint tokenBalance = balances[holder];
    uint availableDividends = totalDeposited -  totalWithdrawn[holder];

    uint holderShare = wdiv(tokenBalance, INITIAL_SUPPLY);
    uint holderValue = wmul(availableDividends, holderShare);

    return holderValue;
  }

  function depositDividends() public payable valueDivisibleBySupply() {
    GotDividends(msg.value);
    totalDeposited += msg.value;
  }

  function () {
    revert();
  }

}