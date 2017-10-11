var NameStorageFacade = artifacts.require("./NameStorageFacade.sol");
var Web3Utils = require('web3-utils');

contract('NameStorageFacade', function(accounts) {
  
  it("does not have type addresses by default", async function() {
    let meta = await NameStorageFacade.deployed();
    let type = 0;
    
    let contractAddress = (await meta.requireNameTypeAddress.call(type).catch(function() { return 0; }));
    assert.equal(contractAddress, 0);
  });

  it("allows registering name type storage", async function() {
    let meta = await NameStorageFacade.deployed();
    let type = 0;

    await meta.ensureCanStore(type);
    let schemaCount = (await meta.requireNameTypeAddress.call(type));
    assert.notEqual(schemaCount, 0);
  });

  it("[scenario] can return name count and all values", async function() {
    let meta = await NameStorageFacade.deployed();
    
    let type = 0;
    await meta.ensureCanStore(type);

    let nameCount = (await meta.getNameCount.call(type));
    assert.equal(nameCount, 0);

    let nameParts = [web3.fromAscii("test")];
    await meta.submitName(type, nameParts);

    let nameCount2 = (await meta.getNameCount.call(type));
    assert.equal(nameCount2, 1);

    let nameIx = await meta.getNameIndex.call(type, nameParts);
    assert.equal(nameIx, 0);

    let nameIxBad = await meta.getNameIndex.call(type, [web3.fromAscii("not existant test")]);
    assert.equal(nameIxBad, -1);

    let name = web3
      .toAscii(await meta.getNameChunkAt.call(type, nameIx, 0))
      .replace(/\u0000/g, '');
    assert.equal(name, "test");

    var badNameCall = false;
    await meta.getNameChunkAt
      .call(type + 1 /*non existant*/, nameIx, 0)
      .catch(_ => badNameCall = true);
    
    assert.equal(badNameCall, true);
  });

});