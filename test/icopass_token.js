
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

contract('IcoPassToken', function (accounts) {
  beforeEach(async function () {
    token = await IcoPassToken.new(accounts[0]);
  });

  // it('should return the correct totalSupply after construction', async function () {
  //   let totalSupply = await token.totalSupply();

  //   assert.equal(totalSupply.toNumber(), 10000000);
  // });

  // it('should set treasury to max supply during construction', async function () {
  //   let treasuryBalance = await token.balanceOf(accounts[0]);

  //   assert.equal(treasuryBalance.toNumber(), 10000000);
  // });

  // it('should return the correct allowance amount after approval', async function () {
  //   let token = await IcoPassToken.new(accounts[0]);
  //   await token.approve(accounts[1], 10000000);
  //   let allowance = await token.allowance(accounts[0], accounts[1]);

  //   assert.equal(allowance, 10000000);
  // });

  // it('should return correct balances after transfer', async function () {
  //   let token = await IcoPassToken.new(accounts[0]);
  //   await token.transfer(accounts[1], 10000000);
  //   let balance0 = await token.balanceOf(accounts[0]);
  //   assert.equal(balance0, 0);

  //   let balance1 = await token.balanceOf(accounts[1]);
  //   assert.equal(balance1, 10000000);
  // });

  // it('should throw an error when trying to transfer more than balance', async function () {
  //   let token = await IcoPassToken.new(accounts[0]);
  //   try {
  //     await token.transfer(accounts[1], 10000001);
  //     assert.fail('should have thrown before');
  //   } catch (error) {
  //     assertRevert(error);
  //   }
  // });

  // it('should return correct balances after transfering from another account', async function () {
  //   let token = await IcoPassToken.new(accounts[0]);
  //   await token.approve(accounts[1], 10000000);
  //   await token.transferFrom(accounts[0], accounts[2], 10000000, { from: accounts[1] });

  //   let balance0 = await token.balanceOf(accounts[0]);
  //   assert.equal(balance0, 0);

  //   let balance1 = await token.balanceOf(accounts[2]);
  //   assert.equal(balance1, 10000000);

  //   let balance2 = await token.balanceOf(accounts[1]);
  //   assert.equal(balance2, 0);
  // });

  // it('should throw an error when trying to transfer more than allowed', async function () {
  //   await token.approve(accounts[1], 10000000 - 1);
  //   try {
  //     await token.transferFrom(accounts[0], accounts[2], 10000000, { from: accounts[1] });
  //     assert.fail('should have thrown before');
  //   } catch (error) {
  //     assertRevert(error);
  //   }
  // });

  // it('should throw an error when trying to transferFrom more than _from has', async function () {
  //   let balance0 = await token.balanceOf(accounts[0]);
  //   await token.approve(accounts[1], 99);
  //   try {
  //     await token.transferFrom(accounts[0], accounts[2], balance0 + 1, { from: accounts[1] });
  //     assert.fail('should have thrown before');
  //   } catch (error) {
  //     assertRevert(error);
  //   }
  // });

  // describe('payment distribution among holders', function () {
  //   it("should not accept payments with no value", async function() {
  //     try {
  //       await token.distributeAmongHolders({value: 0});
  //       assert.fail('should have thrown before');
  //     } catch (error) {
  //       assertRevert(error);
  //     }
  //   })

  //   it("should distribute value proportionally among contributors", async function() {
  //       var preDividendBalance1 = await web3.eth.getBalance(accounts[1]);
  //       var preDividendBalance2 = await web3.eth.getBalance(accounts[2]);
  //       var preDividendBalance3 = await web3.eth.getBalance(accounts[3]);

  //       await token.transfer(accounts[1], 1000000); // 10%
  //       await token.transfer(accounts[2], 4000000); // 40%
  //       await token.transfer(accounts[3], 5000000); // 50%

  //       await token.distributeAmongHolders({value: 100});
        
  //       var postDividendBalance1 = await web3.eth.getBalance(accounts[1]);
  //       var postDividendBalance2 = await web3.eth.getBalance(accounts[2]);
  //       var postDividendBalance3 = await web3.eth.getBalance(accounts[3]);

  //       preDividendBalance1.plus(10).should.be.bignumber.equal(postDividendBalance1);
  //       preDividendBalance2.plus(40).should.be.bignumber.equal(postDividendBalance2);
  //       preDividendBalance3.plus(50).should.be.bignumber.equal(postDividendBalance3);
  //   })

  it("increases expectedly when holders get added/removed", async function () {
    this.timeout(5000000)

    let iterations = 50000;
    var holders = [];
    let requiredKeyCount = Math.min(100, accounts.length - 1);
    let tokenCount = (10000 / requiredKeyCount)

    for (var i = 1; i <= requiredKeyCount; ++i) {
      let newHolder = accounts[i];
      
      var transferTx = await token.transfer(newHolder, tokenCount * 1000);
      console.log("Sent ", tokenCount * 10000, " to ", newHolder, ": ", transferTx.receipt.gasUsed);
      holders.push(newHolder);
    }

    console.log("=== Now transferring between accounts ===");
    console.log("=== Now transferring between accounts ===");
    console.log("=== Now transferring between accounts ===");
    console.log("=== Now transferring between accounts ===");

    var tx;
    exec("echo \"\" > /tmp/out");
    for (i = 0; i < iterations; ++i) {
      let fromIx = i % holders.length
      let toIx = (i+1) % holders.length
      let from = holders[fromIx]
      let to = holders[toIx]
      console.log("From: ", from)
      console.log("To: ", to)
      tx = await token.transfer(to, tokenCount * 1000, {from: from})
      console.log(tx.receipt.gasUsed)
      exec("echo "+tx.receipt.gasUsed+" >> /tmp/out");
    }

    // 79790

    // tx holds the last (== most expensive) transaction receipt
    console.log("Receipt for last transfer: ", tx.receipt.gasUsed);
    assert.fail("yo");
  });

  // it("should have a transaction fee in the expected range", async function () {
  //   this.timeout(900000)

  //   let iterations = 10;
  //   let tokenCount = (10000 / iterations)
  //   for (var i = 0; i < iterations; ++i) {
  //     await token.transfer(randomAddress(), tokenCount * 1000); 
  //     if (i % 100 == 0) {
  //       console.log(i);
  //     }
  //   }
    
  //   let tx = await token.distributeAmongHolders({value: 10000000, gas: 100000000});
    
  //   // 1800000000000000
  //   // (3500122000000000*50)/1000000000000000000
  //   // (3500122000000000*1000)/1000000000000000000

  //   console.log("Receipt for dividends: ", tx.receipt.gasUsed);
  //   // tx.receipt.gasUsed.should.be.bignumber.lessThan(180);
  // })
  

  //   it("should fail value can not be split exactly", async function() {
  //     await token.transfer(accounts[1], 1100000); // 11%
  //     await token.transfer(accounts[2], 4000000); // 40%
  //     await token.transfer(accounts[3], 4900000); // 49%
      
  //     // 101 will be split into 11, 40 and 49. 1 wei is left over
  //     try {
  //       await token.distributeAmongHolders({value: 101});
  //       assert.fail('should have thrown before');
  //     } catch (error) {
  //       assertRevert(error);
  //     }
  //   })
  // })

  // describe('validating allowance updates to spender', function () {
  //   let preApproved;

  //   it('should start with zero', async function () {
  //     preApproved = await token.allowance(accounts[0], accounts[1]);
  //     assert.equal(preApproved, 0);
  //   });

  //   it('should increase by 50 then decrease by 10', async function () {
  //     await token.increaseApproval(accounts[1], 5000000);
  //     let postIncrease = await token.allowance(accounts[0], accounts[1]);
  //     preApproved.plus(5000000).should.be.bignumber.equal(postIncrease);
  //     await token.decreaseApproval(accounts[1], 1000000);
  //     let postDecrease = await token.allowance(accounts[0], accounts[1]);
  //     postIncrease.minus(1000000).should.be.bignumber.equal(postDecrease);
  //   });
  // });

  // it('should increase by 50 then set to 0 when decreasing by more than 50', async function () {
  //   await token.approve(accounts[1], 5000000);
  //   await token.decreaseApproval(accounts[1], 6000000);
  //   let postDecrease = await token.allowance(accounts[0], accounts[1]);
  //   assert.equal(postDecrease, 0);
  // });

  // it('should throw an error when trying to transfer to 0x0', async function () {
  //   let token = await IcoPassToken.new(accounts[0]);
  //   try {
  //     await token.transfer(0x0, 100);
  //     assert.fail('should have thrown before');
  //   } catch (error) {
  //     assertRevert(error);
  //   }
  // });

  // it('should throw an error when trying to transferFrom to 0x0', async function () {
  //   let token = await IcoPassToken.new(accounts[0]);
  //   await token.approve(accounts[1], 100);
  //   try {
  //     await token.transferFrom(accounts[0], 0x0, 10000000, { from: accounts[1] });
  //     assert.fail('should have thrown before');
  //   } catch (error) {
  //     assertRevert(error);
  //   }
  // });
});
