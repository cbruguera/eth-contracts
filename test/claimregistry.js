var ClaimRegistry = artifacts.require("./ClaimRegistry.sol");
var Web3Utils = require('web3-utils');

contract('ClaimRegistry', function(accounts) {
  
  // it("reports the correct schema name count", async function() {
  //   let meta = await ClaimRegistry.deployed();
    
  //   let schemaCount = (await meta.getSchemaNameCount.call());
  //   assert.equal(schemaCount, 0);

  //   await meta.submitSchemaName([web3.fromAscii("test")]);
    
  //   let schemaCount2 = (await meta.getSchemaNameCount.call());
  //   assert.equal(schemaCount2, 1);
  // });

  // it("can get schema name index based on name", async function() {
  //   let meta = await ClaimRegistry.deployed();
  //   let nameParts = [web3.fromAscii("http://schema.org/yo")];
    
  //   let result = (await meta.submitSchemaName(nameParts));
  //   let expectedSchemaIx = result.logs[0].args["ix"];

  //   let actualSchemaIx = (await meta.getSchemaNameIndex.call(nameParts));
  //   assert.notEqual(actualSchemaIx, expectedSchemaIx);
  // });

  // it("can submit a new schema name", async function() {
  //   let meta = await ClaimRegistry.deployed();
  //   let nameParts = [
  //     web3.fromAscii("00000000000000000000000000000000"), 
  //     web3.fromAscii("10000000000000000000000000000000")
  //   ];
    
  //   let result = (await meta.submitSchemaName(nameParts));
  //   let schemaIx = result.logs[0].args["ix"];
    
  //   assert.notEqual(schemaIx, 0, "New schema can not have index 0");
  // });
 
  it("can return claim name count and indexed claims", async function() {
    let meta = await ClaimRegistry.deployed();
    
    let claimNameCount = (await meta.getClaimNameCount.call());
    assert.equal(claimNameCount, 0);

    let claimNameParts = [web3.fromAscii("test")];
    await meta.submitClaimName(claimNameParts);

    let claimNameCount2 = (await meta.getClaimNameCount.call());
    assert.equal(claimNameCount2, 1);

    let claimNameIx = await meta.getClaimNameIndex.call(claimNameParts);
    assert.equal(claimNameIx, 0);

    let claimNameIxBad = await meta.getClaimNameIndex.call([web3.fromAscii("not existant test")]);
    assert.equal(claimNameIxBad, -1);

    let claim = web3
      .toAscii(await meta.getClaimNameChunkAt.call(claimNameIx, 0))
      .replace(/\u0000/g, '');
    assert.equal(claim, "test");
  });

  // it("can get claim name index based on name", async function() {
  //   let meta = await ClaimRegistry.deployed();
  //   let nameParts = [web3.fromAscii("person")];
    
  //   let result = (await meta.submitClaimName(nameParts));
  //   let expectedClaimIx = result.logs[0].args["ix"];

  //   let actualClaimIx = (await meta.getClaimNameIndex.call(nameParts));
  //   assert.notEqual(actualClaimIx, expectedClaimIx);
  // });

  // it("can submit a new claim name", async function() {
  //   let meta = await ClaimRegistry.deployed();
  //   let nameParts = [
  //     web3.fromAscii("00000000000000000000000000000000"), 
  //     web3.fromAscii("10000000000000000000000000000000")
  //   ];
    
  //   let result = (await meta.submitClaimName(nameParts));
  //   let claimNameIx = result.logs[0].args["ix"];
    
  //   assert.notEqual(claimNameIx, 0, "New schema can not have index 0");
  // });

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
