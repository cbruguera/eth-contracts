var KeyProofs = artifacts.require("./KeyProofs.sol");
var Web3Utils = require('web3-utils');

var prepareMetaProof = function(signatureHexString, unmodifiedHash) {
  let r = '0x' + signatureHexString.slice(2, 66) // 64
  let s = '0x' + signatureHexString.slice(66, 130) // 64
  var v = web3.toDecimal('0x' + signatureHexString.slice(130, 132)) 

  var sanitizedHash = unmodifiedHash;
  
  let isTestRpc = true;
  
  // If smart contract does not add prefix and we sign via Geth's eth_sign, 
  // then we need to add the prefix.
  //
  // Currently the Smart Contract will add it, so it is set to false.
  let addPrefix = !isTestRpc; // testRPC does not add the prefix when signing
  if (addPrefix) {
    sanitizedHash = Web3Utils.soliditySha3(web3.fromAscii("\u0019Ethereum Signed Message:\n32"), unmodifiedHash);
  }

  if (isTestRpc) {
    // TestRPC expects V offset by 27
    v += 27;
  }

  return {r: r, s: s, v: v, hash: sanitizedHash};
}

var metaProofFromRequestTransaction = function (requestProofTx, signAccount) {
  assert.equal(requestProofTx.logs.length > 0, true, "Expecting at least 1 log from requestProofTx");
  
  var challengeUuid = requestProofTx.logs[0].args["uuid"];
  var challengeValidator = requestProofTx.logs[0].args["validator"];
  var challengeTimestamp = requestProofTx.logs[0].args["timestamp"].toNumber();
  var sigHashHexString = Web3Utils.soliditySha3(challengeUuid, challengeTimestamp, challengeValidator);
  let signatureHexString = web3.eth.sign(signAccount, sigHashHexString);

  return prepareMetaProof(signatureHexString, sigHashHexString);
}

contract('KeyProofs', function(accounts) {
  
  it("allows creating one challenge per-uuid", async function() {
    var uuid = "0x3198bc9c66725ab3d9954942343ae5b6"; // must differ from other tests
    
    let meta = await KeyProofs.deployed();
    let firstTx = await meta.requestProof(uuid, {from: accounts[0]});
    let secondTx = await meta.requestProof(uuid, {from: accounts[0]}).catch(function() {});
    
    assert.equal(1, firstTx.logs.length, "Expected first attempt to produce an event"); 

    if (secondTx != undefined) { // undefined on testrpc (due to catch())
      assert.equal(0, secondTx.logs.length, "Expected second attempt to poduce 0 events"); 
    }
  });

  it("returns challenge information", async function() {
    var uuid = "0x11111111111111111111111111111112"; // must differ from other tests
    
    let meta = await KeyProofs.deployed();
    let requestProof = await meta.requestProof(uuid, {from: accounts[0]});
    let metaTimestamp = web3.eth.getBlock(requestProof.receipt.blockNumber).timestamp;
    let result = await meta.getChallenge.call(uuid);
    
    assert.equal(result[0], accounts[0]);
    assert.equal(result[1].toNumber(), metaTimestamp);
  });

  it("returns response information ", async function() {
    var uuid = "0x11111111111111111111111111111113"; // must differ from other tests
    
    let meta = await KeyProofs.deployed();
    let requestProofTx = await meta.requestProof(uuid, {from: accounts[0]});
    metaProof = metaProofFromRequestTransaction(requestProofTx, accounts[1]);

    let submitProofTx = await meta.submitProofEC(uuid, accounts[1], metaProof.v, metaProof.hash, metaProof.r, metaProof.s, {from: accounts[1]});
    
    assert.equal(submitProofTx.logs.length, 1, "Expected 1 event to be generated by submitProof");
    
    result = await meta.getSignerAndSignatureInput.call(uuid);
    assert.equal(result[0], accounts[1]);
    assert.equal(result[1], metaProof.hash);
  });

  it("does not allow submitting proofs without a valid challenge uuid", async function() {
    var uuid = "0x11111111111111111111111111111111"; // must differ from other tests
    
    let actualSigningAccount = accounts[0]; // sign with this...
    let reportedSigningAccount = accounts[2]; // ... but verify with this (so that it fails)
    
    let meta = await KeyProofs.deployed();
    
    let randomSigInput = Web3Utils.soliditySha3(uuid, 100, accounts[0]);
    let signatureHexString = web3.eth.sign(actualSigningAccount, randomSigInput); 
    metaProof = prepareMetaProof(signatureHexString, randomSigInput);
    
    let submitProofTx = await meta.submitProofEC(uuid, reportedSigningAccount, 
      metaProof.v, metaProof.hash, metaProof.r, metaProof.s, {from: accounts[1]}).catch(function() {});

    if (submitProofTx != undefined) { // undefined on testrpc (due to catch())
      assert.equal(submitProofTx.logs.length, 0, "Expected 0 logs from invalid submitProof");
    }
  });

  it("does not allow submitting proofs with invalid signature", async function() {
    var uuid = "0x3198bc9c66725ab3d9954942343ae5b9"; // must differ from other tests
    
    let actualSigningAccount = accounts[0]; // sign with this...
    let reportedSigningAccount = accounts[2]; // ... but verify with this (so that it fails)
    
    let meta = await KeyProofs.deployed();
    let requestProofTx = await meta.requestProof(uuid, {from: accounts[0]});
    
    let metaProof = metaProofFromRequestTransaction(requestProofTx, actualSigningAccount);
  
    let submitProofTx = await meta.submitProofEC(uuid, reportedSigningAccount, metaProof.v, metaProof.hash, metaProof.r, metaProof.s, {from: accounts[1]}).catch(function() {});
    
    if (submitProofTx != undefined) { // undefined on testrpc (due to catch())
      assert.equal(submitProofTx.logs.length, 0, "submitProof should fail and not emit events");
    }
  });

  it("allows submitting valid proofs exactly once", async function() {
    var uuid = "0x1298bc9c66725ab3d9954942343ae5b9"; // must differ from other tests
    let meta = await KeyProofs.deployed();
    
    let requestProofTx = await meta.requestProof(uuid, {from: accounts[0]});
    let metaProof = metaProofFromRequestTransaction(requestProofTx, accounts[1]);
    let submitProofTxA = await meta.submitProofEC(uuid, accounts[1], 
      metaProof.v, metaProof.hash, metaProof.r, metaProof.s, {from: accounts[1]});
    let submitProofTxB = await meta.submitProofEC(uuid, accounts[1], 
      metaProof.v, metaProof.hash, metaProof.r, metaProof.s, {from: accounts[1]}).catch(function() {});
    
    assert.equal(submitProofTxA.logs.length, 1);
    if (submitProofTxB != undefined) { // undefined on testrpc (due to catch())
      assert.equal(submitProofTxB.logs.length, 0);
    }

    await meta.sealProof(uuid, 10, {from: accounts[0]});
    let isSenderValidator = await meta.isValidatedBy.call(accounts[1], accounts[0], {from: accounts[0]});

    assert.equal(isSenderValidator, true);
  });

  

});
