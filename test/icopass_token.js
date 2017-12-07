
const assertRevert = require('./helpers/assertRevert');

var IcoPassToken = artifacts.require('./IcoPassToken.sol');

contract('IcoPassToken', function (accounts) {
  beforeEach(async function () {
    token = await IcoPassToken.new(accounts[0]);
  });

  it('should return the correct totalSupply after construction', async function () {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply.toNumber(), 10000000);
  });

  it('should set treasury to max supply during construction', async function () {
    let treasuryBalance = await token.balanceOf(accounts[0]);

    assert.equal(treasuryBalance.toNumber(), 10000000);
  });

  it('should return the correct allowance amount after approval', async function () {
    let token = await IcoPassToken.new(accounts[0]);
    await token.approve(accounts[1], 10000000);
    let allowance = await token.allowance(accounts[0], accounts[1]);

    assert.equal(allowance, 10000000);
  });

  it('should return correct balances after transfer', async function () {
    let token = await IcoPassToken.new(accounts[0]);
    await token.transfer(accounts[1], 10000000);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, 10000000);
  });

  it('should throw an error when trying to transfer more than balance', async function () {
    let token = await IcoPassToken.new(accounts[0]);
    try {
      await token.transfer(accounts[1], 10000001);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should return correct balances after transfering from another account', async function () {
    let token = await IcoPassToken.new(accounts[0]);
    await token.approve(accounts[1], 10000000);
    await token.transferFrom(accounts[0], accounts[2], 10000000, { from: accounts[1] });

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[2]);
    assert.equal(balance1, 10000000);

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

  describe('payment distribution among holders', function () {
    // todo
  })

  describe('validating allowance updates to spender', function () {
    let preApproved;

    it('should start with zero', async function () {
      preApproved = await token.allowance(accounts[0], accounts[1]);
      assert.equal(preApproved, 0);
    });

    it('should increase by 50 then decrease by 10', async function () {
      await token.increaseApproval(accounts[1], 5000000);
      let postIncrease = await token.allowance(accounts[0], accounts[1]);
      assert.equal(preApproved.plus(5000000).toNumber(), postIncrease.toNumber());
      await token.decreaseApproval(accounts[1], 1000000);
      let postDecrease = await token.allowance(accounts[0], accounts[1]);
      assert.equal(postIncrease.minus(1000000).toNumber(), postDecrease.toNumber());
    });
  });

  it('should increase by 50 then set to 0 when decreasing by more than 50', async function () {
    await token.approve(accounts[1], 5000000);
    await token.decreaseApproval(accounts[1], 6000000);
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
