var ClaimRegistry = artifacts.require("./ClaimRegistry.sol");
var Web3Utils = require('web3-utils');

contract('ClaimRegistry', function(accounts) {
  
  

  // it("lets submit a claim and query the subject", async function() {
  //   let meta = await ClaimRegistry.deployed();
  //   let schemaNameParts = [web3.fromAscii("http://test/stuff")];
  //   let claimNameParts = [web3.fromAscii("claimName")];
  //   let urlParts = [web3.fromAscii("00000000000000000000000000000000"), 
  //                   web3.fromAscii("11111111111111111111111111111111")];
    
  //   var result = (await meta.submitSchemaName(schemaNameParts));
  //   let schemaNameIx = result.logs[0].args["ix"];
    
  //   result = (await meta.submitClaimName(claimNameParts));
  //   let claimNameIx = result.logs[0].args["ix"];

  //   result = await meta.submitClaim(accounts[0], schemaNameIx, claimNameIx, urlParts, {from: accounts[1]});
    
  //   // verify the event
  //   assert.equal(accounts[0], result.logs[0].args["subject"]);
  //   assert.equal(schemaNameIx, result.logs[0].args["schemaIx"].toNumber());
  //   assert.equal(claimNameIx, result.logs[0].args["claimIx"].toNumber());
  //   assert.equal(Web3Utils.soliditySha3(web3.fromAscii("0000000000000000000000000000000011111111111111111111111111111111")), 
  //     result.logs[0].args["urlHash"]);

  //   // query the subject
  //   result = await meta.getSubjectClaimSetSize.call(accounts[0], schemaNameIx, claimNameIx);
  //   assert.equal(result, 1);

  //   // chunk 0 of the claim
  //   result = await meta.getSubjectClaimSetEntryChunk.call(accounts[0], schemaNameIx, claimNameIx, 0, 0);
  //   assert.equal(result[0], accounts[1], "Claim issuer is not correct");
  //   assert.equal(result[1], web3.fromAscii("00000000000000000000000000000000"));

  //   // chunk 1 of the claim
  //   result = await meta.getSubjectClaimSetEntryChunk.call(accounts[0], schemaNameIx, claimNameIx, 0, 1);
  //   assert.equal(result[0], accounts[1], "Claim issuer is not correct");
  //   assert.equal(result[1], web3.fromAscii("11111111111111111111111111111111"));

  //   // schema metadata
  //   result = await meta.getSubjectSchemaCount.call(accounts[0]);
  //   assert.equal(result, 1);
  //   result = await meta.getSubjectSchemaAt.call(accounts[0], 0);
  //   assert.equal(result.toNumber(), schemaNameIx);

  //   // claim metadata
  //   result = await meta.getSubjectSchemaClaimCount.call(accounts[0], schemaNameIx);
  //   assert.equal(result, 1);
  //   result = await meta.getSubjectSchemaClaimAt.call(accounts[0], schemaNameIx, 0);
  //   assert.equal(result.toNumber(), claimNameIx);
  // });

});
