var ClaimRegistry = artifacts.require("./ClaimRegistry.sol");
var NameStorageFacade = artifacts.require("./NameStorageFacade.sol");
var KeyProofs = artifacts.require("./KeyProofs.sol");
var Web3Utils = require('web3-utils');

let TYPE_TIX = 0;
let ATTR_TIX = 1;
let URL_TIX = 2;

// TODO: deduplicate from keyproofs.js
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

contract('ClaimRegistry', function(accounts) {
  
  var claimRegistry;
  var keyProofs;
  var names;

  beforeEach(function() {
    return ClaimRegistry.new(keyProofs.address, names.address).then(instance => claimRegistry = instance);
  });

  before(async function() {
    names = await NameStorageFacade.deployed();
    keyProofs = await KeyProofs.deployed();
    
    await names.submitName(TYPE_TIX, [web3.fromAscii("type1")]);
    await names.submitName(TYPE_TIX, [web3.fromAscii("type2")]);
    await names.submitName(TYPE_TIX, [web3.fromAscii("type3")]);

    await names.submitName(ATTR_TIX, [web3.fromAscii("attr1")]);
    await names.submitName(ATTR_TIX, [web3.fromAscii("attr2")]);
    await names.submitName(ATTR_TIX, [web3.fromAscii("attr3")]);

    await names.submitName(URL_TIX, [web3.fromAscii("url1")]);
    await names.submitName(URL_TIX, [web3.fromAscii("url2")]);
    await names.submitName(URL_TIX, [web3.fromAscii("url3")]);
  });

  it("allows yourself to add linked addresses", async function() {
    var threw = false;

    var subject = accounts[0];
    var toBeLinkedAddr = accounts[1];

    // var pendingBlock = web3.eth.getBlock('latest');
    var hash = await web3.eth.sendTransaction({ from: toBeLinkedAddr, to: subject, value: web3.toWei(1, "ether")});
    //  console.log("    TxHash " + hash);
    
    // console.log("Pending block: " + pendingBlock.number);
    // var latestFilter = web3.eth.filter({fromBlock: pendingBlock.number, toBlock: pendingBlock.number + 100}).then( // , address: validate_accounts[0]});
    //     function(error, result){
    //         console.log("Log event: "+ JSON.stringify(result, null, 2));
    //         if (!error) {
    //             latestFilter.stopWatching();
    //         } else {
    //             console.error(error);
    //         }
    //     }
    // );    

    await claimRegistry.submitLinkage(subject, toBeLinkedAddr, hash, {from: subject}).catch(_ => threw = true);
    assert.equal(threw, false);
  });

  it("allows you to remove linked addresses", async function() {
    var threw = false;

    var subject = accounts[0];
    var toBeLinkedAddr = accounts[1];

    await claimRegistry.submitLinkage(subject, toBeLinkedAddr, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject});
  
    await claimRegistry.submitLinkage(subject, 0x9999999c66725ab3d9954942343ae5b9, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject});
    // TODO this call never returns emitted event
    await claimRegistry.terminateLinkage(subject, toBeLinkedAddr, {from: subject}).catch(_ => threw = true);
    assert.equal(threw, false);
  });

  it("allows you to query linked addresses", async function() {
    var subject = accounts[0];
    var toBeLinkedAddr = accounts[1];

    await claimRegistry.submitLinkage(subject, toBeLinkedAddr, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject});
    // TODO count is not returned, test silently fails with no exception

    var lcount = await claimRegistry.getLinkageCount(subject);
    assert.equal(lcount.toNumber, 1, "Linkage count should be equal to 1");
  });
  
  it("does not allow submitting unregistered type claim", async function() {
    var threw = false;
    await claimRegistry.submitClaim(accounts[0], 0, 1, 1).catch(_ => threw = true);

    assert.equal(threw, true);
  });

  it("does not allow submitting unregistered attr claim", async function() {
    var threw = false;
    await claimRegistry.submitClaim(accounts[0], 1, 0, 1).catch(_ => threw = true);

    assert.equal(threw, true);
  });

  it("does not allow submitting unregistered url value", async function() {
    var threw = false;
    await claimRegistry.submitClaim(accounts[0], 1, 1, 0).catch(_ => threw = true);

    assert.equal(threw, true);
  });

  it("allows submitting claims with registered type/attr/url", async function() {
    await claimRegistry.submitClaim(accounts[0], 1, 1, 1);
  });

  it("allows enumerating types for a subject", async function () {
    await claimRegistry.submitClaim(accounts[0], 1, 1, 1);
    await claimRegistry.submitClaim(accounts[0], 2, 1, 1);

    let count = await claimRegistry.getSubjectTypeCount.call(accounts[0]);
    assert.equal(count, 2);
  });

  it("allows enumerating attributes per-type for a subject", async function () {
    await claimRegistry.submitClaim(accounts[0], 1, 1, 1);
    await claimRegistry.submitClaim(accounts[0], 1, 2, 1);
    await claimRegistry.submitClaim(accounts[0], 2, 1, 1);

    // TODO: throws because acc1 is not validator for acc0
    // await claimRegistry.submitClaim(accounts[0], 2, 1, 1, {from: accounts[1]});  // duplicate attr from diff validator, should not increase count

    // type 1 -> 2 attributes; type 2 -> 1 attributes;

    let count1 = await claimRegistry.getSubjectTypeAttrCount.call(accounts[0], 1);
    let count2 = await claimRegistry.getSubjectTypeAttrCount.call(accounts[0], 2);

    assert.equal(count1, 2);
    assert.equal(count2, 1);
  });

  it("allows getting type for a subject with given index", async function () {
    let typeIx = 2;
    await claimRegistry.submitClaim(accounts[0], typeIx, 1, 1);
    
    let actualTypeIx = await claimRegistry.getSubjectTypeAt.call(accounts[0], 0);
    assert.equal(actualTypeIx, typeIx);
  });

  it("allows getting type attr for a subject with given index", async function () {
    let typeIx = 2;
    
    await claimRegistry.submitClaim(accounts[0], typeIx, 1, 1);
    await claimRegistry.submitClaim(accounts[0], typeIx, 2, 1);
    
    let expected1 = await claimRegistry.getSubjectTypeAttrAt.call(accounts[0], typeIx, 0);
    let expected2 = await claimRegistry.getSubjectTypeAttrAt.call(accounts[0], typeIx, 1);
    assert.equal(expected1.toNumber(), 1);
    assert.equal(expected2.toNumber(), 2);
  });

  it("does not allows submitting claims by non-validator, non-self address", async function() {
    let threw = false;

    await claimRegistry.submitClaim(accounts[0], 1, 1, 1, {from: accounts[1]}).catch(_ => threw = true);

    assert.equal(threw, true);
  });

  it("allows submitting claims by validator, non-self address (seal > 0)", async function() {
    var uuid = "0x9999999c66725ab3d9954942343ae5b9"; 

    var subject = accounts[0];
    var validator = accounts[1];
    
    let requestProofTx = await keyProofs.requestProof(uuid, {from: validator});
    let metaProof = metaProofFromRequestTransaction(requestProofTx, subject);
    let submitProofTxA = await keyProofs.submitProofEC(uuid, subject, 
      metaProof.v, metaProof.hash, metaProof.r, metaProof.s, {from: subject});

    await keyProofs.sealProof(uuid, 1, {from: validator});

    let isSenderValidator = await keyProofs.isValidatedBy.call(subject, validator, {from: validator});
    assert.equal(isSenderValidator, true);

    // Should not throw!
    await claimRegistry.submitClaim(subject, 1, 1, 1, {from: validator});
  });

  
  
});
