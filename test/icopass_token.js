
const assertRevert = require('./helpers/assertRevert');
const secp256k1 = require('secp256k1');
const crypto = require('crypto');
const keccak = require('keccak');
const { exec } = require('child_process');

const BigNumber = web3.BigNumber;

let randomAddress = function () {
  return randomKeypair()[1]; 
}

let randomKeypair = function () {
  let privKey = crypto.randomBytes(32)
  let pubKey = secp256k1.publicKeyCreate(privKey)
  var pubKeyBuffer = Buffer(keccak('keccak256').update(pubKey).digest())

  pubKeyBuffer = pubKeyBuffer.slice(12, 32);
  return ['0x' + privKey.toString('hex'), '0x' + pubKeyBuffer.toString('hex')];
}

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var IcoPassToken = artifacts.require('./IcoPassToken.sol');

const expectedSupplyInNonDivisibleParts = 60000000 * 1000;

contract('IcoPassToken', function (accounts) {
  beforeEach(async function () {
    token = await IcoPassToken.new(accounts[0]);
  });

  describe("transfer", function() {
    it("does not allow token recipient to withdraw dividends that have been withdrawn by previous holder", async function() {
      await token.transfer(accounts[1], expectedSupplyInNonDivisibleParts / 4) // 25%
      await token.transfer(accounts[2], expectedSupplyInNonDivisibleParts / 4) // 25%
      await token.transfer(accounts[3], expectedSupplyInNonDivisibleParts / 4) // 25%

      await token.depositDividends({value: expectedSupplyInNonDivisibleParts})
      await token.withdrawDividends(); // accounts[0] withdraws 25%

      await token.transfer(accounts[1], expectedSupplyInNonDivisibleParts / 4) // accounts[1] now has 50% of tokens

      // at this point, if accounts[1] withdraws, they should not attempt to withdraw 50%,
      // because half of their tokens were already used to withdraw money

      var preDividendBalance1 = await web3.eth.getBalance(accounts[1]);
      let txGasPrice = 1000000000;
      let gasFee = (await token.withdrawDividends({from: accounts[1], gasPrice: txGasPrice})).receipt.gasUsed;

      var postDividendBalance1 = await web3.eth.getBalance(accounts[1]);

      let expectedTxFees = gasFee * txGasPrice;

      postDividendBalance1.minus(preDividendBalance1).plus(expectedTxFees).should.be.bignumber.equal(expectedSupplyInNonDivisibleParts / 4);
    });
  });

  describe("fallback function", function () {
    it("does not accept values non-divisible by supply", async function() {
      try {
        await token.depositDividends({value: expectedSupplyInNonDivisibleParts + 1})
        assert.fail('should have thrown before');
      } catch (error) {
        assertRevert(error);
      }
    });

    it("deposits received value as dividends", async function() {
      let preBalance0 = await web3.eth.getBalance(accounts[0]);
      let gasPrice = 1000000000
      let txGas1 = (await token.sendTransaction({gasPrice: gasPrice, value: expectedSupplyInNonDivisibleParts})).receipt.gasUsed
      let txGas2 = (await token.withdrawDividends({gasPrice: gasPrice})).receipt.gasUsed
      let txFees = (txGas1 + txGas2) * gasPrice
      let postBalance0 = await web3.eth.getBalance(accounts[0])

      preBalance0.minus(txFees).should.be.bignumber.equal(postBalance0)
    });
  });

  describe("transferFrom", function () {
    it("assigns dividends to the owner instead of spender", async function () {
      await token.depositDividends({value: expectedSupplyInNonDivisibleParts})

      await token.approve(accounts[2], expectedSupplyInNonDivisibleParts / 4);
      await token.transferFrom(accounts[0], accounts[1], expectedSupplyInNonDivisibleParts / 4, {from: accounts[2]})

      var preDividendBalance0 = await web3.eth.getBalance(accounts[0]);
      var preDividendBalance1 = await web3.eth.getBalance(accounts[1]);
      var preDividendBalance2 = await web3.eth.getBalance(accounts[2]);

      // 0 should have 100% dividends, others 0%
      let txGasPrice = 1000000000;
      let txGas0 = (await token.withdrawDividends({from: accounts[0], gasPrice: txGasPrice})).receipt.gasUsed;
      let txGas1 = (await token.withdrawDividends({from: accounts[1], gasPrice: txGasPrice})).receipt.gasUsed;
      let txGas2 = (await token.withdrawDividends({from: accounts[2], gasPrice: txGasPrice})).receipt.gasUsed;

      var postDividendBalance0 = await web3.eth.getBalance(accounts[0]);
      var postDividendBalance1 = await web3.eth.getBalance(accounts[1]);
      var postDividendBalance2 = await web3.eth.getBalance(accounts[2]);

      postDividendBalance0.minus(preDividendBalance0).plus(txGas0 * txGasPrice).should.be.bignumber.equal(expectedSupplyInNonDivisibleParts);
      postDividendBalance1.minus(preDividendBalance1).plus(txGas1 * txGasPrice).should.be.bignumber.equal(0);
      postDividendBalance2.minus(preDividendBalance2).plus(txGas2 * txGasPrice).should.be.bignumber.equal(0);
    });

    it("does not allow token recipient to withdraw dividends that have been withdrawn by previous holder", async function() {

      await token.transfer(accounts[1], expectedSupplyInNonDivisibleParts / 4) // 25%
      await token.transfer(accounts[2], expectedSupplyInNonDivisibleParts / 4) // 25%
      await token.transfer(accounts[3], expectedSupplyInNonDivisibleParts / 4) // 25%

      await token.depositDividends({value: expectedSupplyInNonDivisibleParts})
      await token.withdrawDividends(); // accounts[0] withdraws 25%

      await token.approve(accounts[2], expectedSupplyInNonDivisibleParts / 4);
      await token.transferFrom(accounts[0], accounts[1], expectedSupplyInNonDivisibleParts / 4, {from: accounts[2]}) // accounts[1] now has 50% of tokens

      // at this point, if accounts[1] withdraws, they should not attempt to withdraw 50%,
      // because half of their tokens were already used to withdraw money

      var preDividendBalance1 = await web3.eth.getBalance(accounts[1]);
      let txGasPrice = 1000000000;
      let gasFee = (await token.withdrawDividends({from: accounts[1], gasPrice: txGasPrice})).receipt.gasUsed;

      var postDividendBalance1 = await web3.eth.getBalance(accounts[1]);

      let expectedTxFees = gasFee * txGasPrice;

      postDividendBalance1.minus(preDividendBalance1).plus(expectedTxFees).should.be.bignumber.equal(expectedSupplyInNonDivisibleParts / 4);
    });
  });

  describe("withdrawDividends", function() {
    it("does nothing if there are no dividends", async function () {
      var preDividendBalance0 = await web3.eth.getBalance(accounts[0]);
      let txGasPrice = 1000000000;
      let txGasFee = (await token.withdrawDividends({gasPrice: txGasPrice})).receipt.gasUsed;
      var postDividendBalance0 = await web3.eth.getBalance(accounts[0]);

      let expectedTxFee = txGasFee * txGasPrice;
      preDividendBalance0.minus(postDividendBalance0).should.be.bignumber.equal(expectedTxFee);
    });

    it("does not allow token recipient to withdraw dividends that have been withdrawn by previous holder", async function() {

      await token.transfer(accounts[1], expectedSupplyInNonDivisibleParts / 4) // 25%
      await token.transfer(accounts[2], expectedSupplyInNonDivisibleParts / 4) // 25%
      await token.transfer(accounts[3], expectedSupplyInNonDivisibleParts / 4) // 25%

      await token.depositDividends({value: expectedSupplyInNonDivisibleParts})
      await token.withdrawDividends(); // accounts[0] withdraws 25%

      await token.transfer(accounts[1], expectedSupplyInNonDivisibleParts / 4) // accounts[1] now has 50% of tokens

      // at this point, if accounts[1] withdraws, they should not attempt to withdraw 50%,
      // because half of their tokens were already used to withdraw money

      var preDividendBalance1 = await web3.eth.getBalance(accounts[1]);
      let txGasPrice = 1000000000;
      let gasFee = (await token.withdrawDividends({from: accounts[1], gasPrice: txGasPrice})).receipt.gasUsed;

      var postDividendBalance1 = await web3.eth.getBalance(accounts[1]);

      let expectedTxFees = gasFee * txGasPrice;

      postDividendBalance1.minus(preDividendBalance1).plus(expectedTxFees).should.be.bignumber.equal(expectedSupplyInNonDivisibleParts / 4);
    });

    it("does not allow the same dividends to be withdrawn twice", async function () {
      await token.depositDividends({value: expectedSupplyInNonDivisibleParts})

      var preDividendBalance0 = await web3.eth.getBalance(accounts[0]);

      let txGasPrice = 1000000000;
      let gasFee1 = (await token.withdrawDividends({gasPrice: txGasPrice})).receipt.gasUsed;
      let gasFee2 = (await token.withdrawDividends({gasPrice: txGasPrice})).receipt.gasUsed;

      var postDividendBalance0 = await web3.eth.getBalance(accounts[0]);

      let expectedTxFees = (gasFee1 + gasFee2) * txGasPrice;
      postDividendBalance0.minus(preDividendBalance0).plus(expectedTxFees).should.be.bignumber.equal(expectedSupplyInNonDivisibleParts);
    });

    it("adds proportional dividend amount to token holders' ethereum balances", async function () {
      var preDividendBalance1 = await web3.eth.getBalance(accounts[1]);
      var preDividendBalance2 = await web3.eth.getBalance(accounts[2]);

      await token.transfer(accounts[1], expectedSupplyInNonDivisibleParts / 4); // 25%
      await token.transfer(accounts[2], (expectedSupplyInNonDivisibleParts / 4) * 3); // 75%

      await token.depositDividends({value: expectedSupplyInNonDivisibleParts})

      let txGasPrice = 1000000000;
      let gasFee1 = (await token.withdrawDividends({from: accounts[1], gasPrice: txGasPrice})).receipt.gasUsed;
      let gasFee2 = (await token.withdrawDividends({from: accounts[2], gasPrice: txGasPrice})).receipt.gasUsed;

      var postDividendBalance1 = await web3.eth.getBalance(accounts[1]);
      var postDividendBalance2 = await web3.eth.getBalance(accounts[2]);

      postDividendBalance1.minus(preDividendBalance1).plus(gasFee1 * txGasPrice).should.be.bignumber.equal(expectedSupplyInNonDivisibleParts / 4);
      postDividendBalance2.minus(preDividendBalance2).plus(gasFee2 * txGasPrice).should.be.bignumber.equal((expectedSupplyInNonDivisibleParts / 4) * 3);
    });
  });

  describe("depositDividends", function() {
    it("refuses amount which is not divisible by token supply", async function () {

      try {
        await token.depositDividends({value: expectedSupplyInNonDivisibleParts + 1})
        assert.fail('should have thrown before');
      } catch (error) {
        assertRevert(error);
      }

      try {
        await token.depositDividends({value: expectedSupplyInNonDivisibleParts - 1})
        assert.fail('should have thrown before');
      } catch (error) {
        assertRevert(error);
      }
    });

    it("accepts amount which is divisible by token supply", async function () {
      await token.depositDividends({value: expectedSupplyInNonDivisibleParts})
    });
  });

  it('should return the correct totalSupply after construction', async function () {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply.toNumber(), expectedSupplyInNonDivisibleParts);
  });

  it('should set treasury to max supply during construction', async function () {
    let treasuryBalance = await token.balanceOf(accounts[0]);

    assert.equal(treasuryBalance.toNumber(), expectedSupplyInNonDivisibleParts);
  });

  it('should return the correct allowance amount after approval', async function () {
    let token = await IcoPassToken.new(accounts[0]);
    await token.approve(accounts[1], 10000000);
    let allowance = await token.allowance(accounts[0], accounts[1]);

    assert.equal(allowance, 10000000);
  });

  it('should return correct balances after transfer', async function () {
    let token = await IcoPassToken.new(accounts[0]);
    await token.transfer(accounts[1], expectedSupplyInNonDivisibleParts);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, expectedSupplyInNonDivisibleParts);
  });

  it('should throw an error when trying to transfer more than balance', async function () {
    let token = await IcoPassToken.new(accounts[0]);
    try {
      await token.transfer(accounts[1], expectedSupplyInNonDivisibleParts + 1);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should return correct balances after transfering from another account', async function () {
    let token = await IcoPassToken.new(accounts[0]);
    await token.approve(accounts[1], expectedSupplyInNonDivisibleParts);
    await token.transferFrom(accounts[0], accounts[2], expectedSupplyInNonDivisibleParts, { from: accounts[1] });

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[2]);
    assert.equal(balance1, expectedSupplyInNonDivisibleParts);

    let balance2 = await token.balanceOf(accounts[1]);
    assert.equal(balance2, 0);
  });

  it('should throw an error when trying to transfer more than allowed', async function () {
    await token.approve(accounts[1], 10000000 - 1);
    try {
      await token.transferFrom(accounts[0], accounts[2], 10000000, { from: accounts[1] });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transferFrom more than _from has', async function () {
    let balance0 = await token.balanceOf(accounts[0]);
    await token.approve(accounts[1], 99);
    try {
      await token.transferFrom(accounts[0], accounts[2], balance0 + 1, { from: accounts[1] });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  describe('validating allowance updates to spender', function () {
    let preApproved;

    it('should start with zero', async function () {
      preApproved = await token.allowance(accounts[0], accounts[1]);
      assert.equal(preApproved, 0);
    });

    it('should increase by 50% then decrease by 10%', async function () {
      await token.increaseApproval(accounts[1], 5000 * 1000);
      let postIncrease = await token.allowance(accounts[0], accounts[1]);
      preApproved.plus(5000 * 1000).should.be.bignumber.equal(postIncrease);
      await token.decreaseApproval(accounts[1], 1000 * 1000);
      let postDecrease = await token.allowance(accounts[0], accounts[1]);
      postIncrease.minus(1000 * 1000).should.be.bignumber.equal(postDecrease);
    });
  });

  it('should increase by 50% then set to 0 when decreasing by more than 50%', async function () {
    await token.approve(accounts[1], 5000 * 1000);
    await token.decreaseApproval(accounts[1], 6000 * 1000);
    let postDecrease = await token.allowance(accounts[0], accounts[1]);
    assert.equal(postDecrease, 0);
  });

  it('should throw an error when trying to transfer to 0x0', async function () {
    let token = await IcoPassToken.new(accounts[0]);
    try {
      await token.transfer(0x0, 100);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transferFrom to 0x0', async function () {
    let token = await IcoPassToken.new(accounts[0]);
    await token.approve(accounts[1], 100);
    try {
      await token.transferFrom(accounts[0], 0x0, 10000000, { from: accounts[1] });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });
});
