var ClaimRegistry = artifacts.require("./ClaimRegistry.sol");
var NameStorageFacade = artifacts.require("./NameStorageFacade.sol");
var KeyProofs = artifacts.require("./KeyProofs.sol");
var Web3Utils = require('web3-utils');




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
  });

  it("allows yourself to add linked addresses", async function() {
    var threw = false;

    var subject = accounts[0];
    var toBeLinkedAddr = accounts[1];

    var hash = await web3.eth.sendTransaction({ from: toBeLinkedAddr, to: subject, value: web3.toWei(1, "ether")});
  
    await claimRegistry.submitLinkage( toBeLinkedAddr, hash, {from: subject}).catch(_ => threw = true);
    assert.equal(threw, false);
  });

  it("does not allow to remove unlinked addresses", async function() {
    var threw = false;

    var subject = accounts[0];
    var toBeLinkedAddr = accounts[1];

    await claimRegistry.terminateLinkage( toBeLinkedAddr, {from: subject}).catch(_ => threw = true);
    
    assert.equal(threw, true);
  });

  it("allows you to query linked address count", async function() {
    var subject = accounts[0];

    await claimRegistry.submitLinkage( accounts[1], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[2], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[3], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[4], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[5], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject}).catch(_ => threw = true);
    
    var lcount = await claimRegistry.getLinkageCount.call(subject);
    // var lcount = await claimRegistry.getLinkageCount(subject);
    // console.log(lcount);
    assert.equal(lcount.valueOf(), 5, "Linkage count should be equal to 5");
  });

  it("allows anyone to query linked addresses", async function() {
    var subject = accounts[0];
    var toBeLinkedAddr = accounts[1];

    await claimRegistry.submitLinkage( toBeLinkedAddr, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject});
    await claimRegistry.submitLinkage( 0x6AFbA91610bb76c1687e4C53825f86CE06497003, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject});
    

    var addrs = await claimRegistry.getLinkages.call(subject);
    // console.log(addrs);

    assert.equal(addrs.constructor === Array, true);
    assert.equal(addrs.length === 2, true);
    
  });

  it("allows anyone to query linked addresses proofs", async function() {
    var subject = accounts[0];
    var toBeLinkedAddr = accounts[1];

    await claimRegistry.submitLinkage( toBeLinkedAddr, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject});
    await claimRegistry.submitLinkage( 0x6AFbA91610bb76c1687e4C53825f86CE06497003, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject});
    

    var addrs = await claimRegistry.getLinkagesWithProofs.call(subject);
    // console.log(addrs);

    assert.equal(addrs[0].constructor === Array, true);
    assert.equal(addrs[1].constructor === Array, true);
    assert.equal(addrs[0].length === addrs[1].length, true);
    assert.equal(addrs[1].length === 2, true);
    
  });

  it("allows anyone to lookup subject addresses by linked address (simple)", async function() {
    var subject = accounts[0];
    

    await claimRegistry.submitLinkage( accounts[1], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject});
  
    var addrs = await claimRegistry.getSubjectsByAddress.call(accounts[1]);
    //console.log(addrs);

    assert.equal(addrs.constructor === Array, true, "Lookup result always is array");
    assert.equal(addrs.length === 1, true, "There should be only one linked subject");
    assert.equal(addrs[0] === subject, true, "Subject is corresponding to linker");
    
    // negative test
    var threw = false;
    var addrsE = await claimRegistry.getSubjectsByAddress.call(accounts[3]).catch(_ => threw = true);
    assert.equal(threw, false, "getSubjectsByAddress should never throw");
    assert.equal(addrsE.length == 0, true, "getSubjectsByAddress must return empty array");
    
  });

  it("allows anyone to query subject addresses by linked address", async function() {
    var subject1 = accounts[0];
    var subject2 = accounts[3];
    var threw = false;

    await claimRegistry.submitLinkage( accounts[1], 0xa64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject1}).catch(_ => threw = true);
    assert.equal(threw, false, "Linkage for subject1 should succeed");
    await claimRegistry.submitLinkage( accounts[2], 0xb64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject1}).catch(_ => threw = true);
    assert.equal(threw, false, "Linkage for subject1 should succeed");
    
    await claimRegistry.submitLinkage( accounts[1], 0xc64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject2}).catch(_ => threw = true);
    assert.equal(threw, false, "Linkage for subject2 should succeed");
    await claimRegistry.submitLinkage( accounts[2], 0xd64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject2}).catch(_ => threw = true);
    assert.equal(threw, false, "Linkage for subject2 should succeed");
    
    var addrsA = await claimRegistry.getSubjectsByAddress.call(accounts[2]);
    // console.log(addrsA);

    assert.equal(addrsA.constructor === Array, true);
    assert.equal(addrsA.length === 2, true);
  
    var addrsB = await claimRegistry.getSubjectsByAddress.call(accounts[1]);
    // console.log(addrsB);

    assert.equal(addrsB.constructor === Array, true);
    assert.equal(addrsB.length === 2, true);
  });

  it("should not allow linking address twice", async function() {
    var threw = false;
    
    var subject = accounts[0];
    var toBeLinkedAddr = accounts[1];

    await claimRegistry.submitLinkage( toBeLinkedAddr, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject});
    await claimRegistry.submitLinkage( toBeLinkedAddr, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject}).catch(_ => threw = true);
        
    assert.equal(threw, true);
  });

  it("allows you to remove linked addresses", async function() {
    var threw = false;
    var subject = accounts[0];
    var toBeLinkedAddr = accounts[1];
    
    // console.log("Contract: "+ JSON.stringify(claimRegistry, null, 2));
    // console.log("Subject: "+ JSON.stringify(toBeLinkedAddr, null, 2), ", link: "+JSON.stringify(toBeLinkedAddr, null, 2)) ;

    await claimRegistry.submitLinkage( toBeLinkedAddr, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject}).catch(_ => threw = true);
    assert.equal(threw, false, "Linkage should be successful to proceed");

    await claimRegistry.terminateLinkage( toBeLinkedAddr, {from: subject}).catch(_ => threw = true);
    assert.equal(threw, false, "Termination should be successful too");

    var lcount = await claimRegistry.getLinkageCount.call(subject);
    assert.equal(lcount.valueOf(), 0, "Linkage count should be equal to 0");

  });

  it("remove should work in case of multiple addresses", async function() {
    var threw = false;
    var subject = accounts[0];
    
    // console.log("Contract: "+ JSON.stringify(claimRegistry, null, 2));
    // console.log("Subject: "+ JSON.stringify(toBeLinkedAddr, null, 2), ", link: "+JSON.stringify(toBeLinkedAddr, null, 2)) ;

    await claimRegistry.submitLinkage( accounts[1], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[2], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[3], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[4], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[5], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject}).catch(_ => threw = true);
    
    assert.equal(threw, false, "Linkage should be successful to proceed");

    await claimRegistry.terminateLinkage( accounts[3], {from: subject}).catch(_ => threw = true);
    assert.equal(threw, false, "Termination should be successful too");

    var lcount = await claimRegistry.getLinkageCount.call(subject);
    assert.equal(lcount.valueOf(), 4, "Linkage count should be equal to 4");
  });

  it("complex triple linked list and multiple addresses", async function() {
    var threw = false;
    var subject1 = accounts[0];
    var subject2 = accounts[6];
    var subject3 = accounts[7];
    
    // console.log("Contract: "+ JSON.stringify(claimRegistry, null, 2));
    // console.log("Subject: "+ JSON.stringify(toBeLinkedAddr, null, 2), ", link: "+JSON.stringify(toBeLinkedAddr, null, 2)) ;

    await claimRegistry.submitLinkage( accounts[1], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject1}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[2], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject1}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[3], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject1}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[4], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject1}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[5], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject1}).catch(_ => threw = true);
    

    await claimRegistry.submitLinkage( accounts[1], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject2}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[2], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject2}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[3], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject2}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[4], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject2}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[5], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject2}).catch(_ => threw = true);
    

    await claimRegistry.submitLinkage( accounts[1], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject3}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[2], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject3}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[3], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject3}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[4], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject3}).catch(_ => threw = true);
    await claimRegistry.submitLinkage( accounts[5], 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject3}).catch(_ => threw = true);
    
    assert.equal(threw, false, "Linkage should be successful to proceed");

    await claimRegistry.terminateLinkage( accounts[3], {from: subject1}).catch(_ => threw = true);
    assert.equal(threw, false, "Termination for subject1 should be successful too");

    await claimRegistry.terminateLinkage( accounts[2], {from: subject2}).catch(_ => threw = true);
    assert.equal(threw, false, "Termination for subject2 should be successful too");

    await claimRegistry.terminateLinkage( accounts[1], {from: subject3}).catch(_ => threw = true);
    assert.equal(threw, false, "Termination for subject3 should be successful too");


    var lcount = await claimRegistry.getLinkageCount.call(subject1);
    assert.equal(lcount.valueOf(), 4, "Linkage count should be equal to 4");

    var lcount = await claimRegistry.getLinkageCount.call(subject2);
    assert.equal(lcount.valueOf(), 4, "Linkage count should be equal to 4");

    var lcount = await claimRegistry.getLinkageCount.call(subject3);
    assert.equal(lcount.valueOf(), 4, "Linkage count should be equal to 4");
  });
  
});
