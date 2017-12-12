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
    var toBeLinkedAddr = accounts[1];

    await claimRegistry.submitLinkage( toBeLinkedAddr, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject});
    await claimRegistry.submitLinkage( 0x6AFbA91610bb76c1687e4C53825f86CE06497003, 0xe64befedd9baae8150524922635405db29d971749b267d4c0428ed952faa0d36, {from: subject});

    var lcount = await claimRegistry.getLinkageCount.call(subject);
    // var lcount = await claimRegistry.getLinkageCount(subject);
    // console.log(lcount);
    assert.equal(lcount.valueOf(), 2, "Linkage count should be equal to 2");
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
    assert.equal(threw, false);

    await claimRegistry.terminateLinkage( toBeLinkedAddr, {from: subject}).catch(_ => threw = true);
    assert.equal(threw, false);
  });
  
});
