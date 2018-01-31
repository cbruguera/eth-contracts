var ClaimRegistry = artifacts.require("./ClaimRegistry.sol");
var TestVerifier = artifacts.require("./TestVerifier.sol");
var NameStorageFacade = artifacts.require("./NameStorageFacade.sol");
var KeyProofs = artifacts.require("./KeyProofs.sol");
var Web3Utils = require('web3-utils');

let TYPE_TIX = 0;
let ATTR_TIX = 1;
let URL_TIX = 2;

// type
let ICO_CONTRIBUTOR = 6;

// attr
let REPORT_BUNDLE_V1 = 6;
let NATIONALITY_INDEX = 7;

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

contract('TestVerifier', function(accounts) {
    var claimRegistry;
    var testVerifier;
    var keyProofs;
    var names;
    var dummyNameIx;
    var subjectAddress;
    var walletAddress;
  
    beforeEach(async function() {
        claimRegistry = await ClaimRegistry.new(keyProofs.address, names.address);
        testVerifier = await TestVerifier.new(accounts[0], claimRegistry.address);

        

        
        await claimRegistry.submitLinkage( walletAddress, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subjectAddress});
    });

    before(async function() {
        keyProofs = await KeyProofs.deployed();
        names = await NameStorageFacade.deployed();

        let dummyReceipt = await names.submitName(URL_TIX, [web3.fromAscii("dummy value")]);
        dummyNameIx = dummyReceipt.logs[0].args["nameIx"];

        subjectAddress = accounts[0]; // account under test should be 0 so that key proving is not required
        walletAddress = accounts[1]; // linked address we are running checks against
    });

    describe("_preventedByNationalityBlacklist", function () {

        it("returns false if blacklist is empty (0)", async function() {
        
            let blacklist = 0;
            var result = await testVerifier.test_preventedByNationalityBlacklist(walletAddress, blacklist);
            
            assert.ok(!result);
        });

        it("returns false if blacklist does not prohibit the nationality index", async function() {
           
            let blacklist = 3;
            let countryIndex = 3;
            
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, NATIONALITY_INDEX, countryIndex);

            var result = await testVerifier.test_preventedByNationalityBlacklist(walletAddress, blacklist);
            
            assert.equal(result, false);
        });

        it("returns true if blacklist prohibits the nationality index", async function() {
            
            let blacklist = 8;    // raw mask
            let countryIndex = 4; // index n translates to mask 2^(n-1). Index 3 => mask 4
            
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, NATIONALITY_INDEX, countryIndex);

            var result = await testVerifier.test_preventedByNationalityBlacklist(walletAddress, blacklist);
            
            assert.ok(result);
        });

    });

    describe("_hasIcoContributorType", function() {

        it("detects lack of ICO contributor type", async function() {
            
            var result = await testVerifier.test_hasIcoContributorType(walletAddress);
            assert.ok(!result);
        });
    
        it("requires report and nationality attributes signed by the trusted issuer", async function() {
            
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, NATIONALITY_INDEX, dummyNameIx);
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, REPORT_BUNDLE_V1, dummyNameIx);
            
            var result = await testVerifier.test_hasIcoContributorType(walletAddress);
            assert.ok(result);
        });

        it("detects if both attributes are issued by an incorrect issuer", async function() {
            
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, NATIONALITY_INDEX, dummyNameIx);
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, REPORT_BUNDLE_V1, dummyNameIx);

            modifiedTestVerifier = await TestVerifier.new(accounts[1], claimRegistry.address);
            
            var result = await modifiedTestVerifier.test_hasIcoContributorType(walletAddress);
            assert.ok(!result);
        });

        it("detects missing nationality", async function() {
            
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, REPORT_BUNDLE_V1, dummyNameIx);
            
            var result = await testVerifier.test_hasIcoContributorType(walletAddress);
            assert.ok(!result);
        });

        it("detects missing report info", async function() {
            
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, NATIONALITY_INDEX, dummyNameIx);
            
            var result = await testVerifier.test_hasIcoContributorType(walletAddress);
            assert.ok(!result);
        });

    });

    describe("modifier onlyVerifiedSenders", function() {
        it("does not allow calls without report bundle", async function () {
            
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, NATIONALITY_INDEX, 1);

            var threw = false;
            var result = await testVerifier.vipFunction(0, {from: walletAddress}).catch(_ => threw = true);
            assert.ok(threw, "Expected function to throw");
        });

        it("does not allow calls without nationality index", async function () {
            
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, REPORT_BUNDLE_V1, 1);

            var threw = false;
            var result = await testVerifier.vipFunction(0, {from: walletAddress}).catch(_ => threw = true);
            assert.ok(threw, "Expected function to throw");
        });

        it("allows calls with report bundle and nationality index (allowed nationality)", async function () {
            
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, REPORT_BUNDLE_V1, dummyNameIx);
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, NATIONALITY_INDEX, 1);

            await testVerifier.vipFunction(0, {from: walletAddress});
        });

        it("does not allows calls with report bundle and nationality index, if nationality is blacklisted", async function () {
            
            let china = 44;
            let blacklist = 8796093022208;  // 44th bit is set (1-indexed)

            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, REPORT_BUNDLE_V1, dummyNameIx);
            await claimRegistry.submitClaim(subjectAddress, ICO_CONTRIBUTOR, NATIONALITY_INDEX, china);

            var threw = false;
            var result = await testVerifier.vipFunction(8796093022208, {from: walletAddress}).catch(_ => threw = true);
            assert.ok(threw, "Expected function to throw");
        });
    });
  
});
