var NameStorageFacade = artifacts.require("./NameStorageFacade.sol");
var Web3Utils = require('web3-utils');

contract('NameStorageFacade', function(accounts) {
  
  var meta;

  beforeEach(function() {
    return NameStorageFacade.new().then(instance => meta = instance);
  });

  it("[scenario] can return name count and all values", async function() {
    let type = 0;
    
    let nameCount = (await meta.getNameCount.call(type));
    assert.equal(nameCount, 0);

    let nameParts = [web3.fromAscii("test")];
    let result = await meta.submitName(type, nameParts);
    let expectedNameIX = result.logs[0].args["nameIx"].toNumber();

    let nameCount2 = (await meta.getNameCount.call(type));
    assert.equal(nameCount2, 1);

    let actualNameIx = await meta.getNameIndex.call(type, nameParts);
    assert.equal(actualNameIx, expectedNameIX);

    let nameIxBad = await meta.getNameIndex.call(type, [web3.fromAscii("not existant test")]);
    assert.equal(nameIxBad, -1);

    let name = web3
      .toAscii(await meta.getNameChunkAt.call(type, actualNameIx, 0))
      .replace(/\u0000/g, '');
    assert.equal(name, "test");

    var badNameCall = false;
    await meta.getNameChunkAt
      .call(type + 1 /*non existant*/, actualNameIx, 0)
      .catch(_ => badNameCall = true);
    
    assert.equal(badNameCall, true);
  });

  it("reports the correct name count", async function() {
    let count = (await meta.getNameCount.call(10)).toNumber();
    assert.equal(count, 0);

    await meta.submitName(10, [web3.fromAscii("test")]);
    
    let count2 = (await meta.getNameCount.call(10)).toNumber();
    assert.equal(count2, 1);
  });

  it("can get index based on name", async function() {
    let asciiName = "http://schema.org/yo";
    let nameParts = [web3.fromAscii(asciiName)];
    
    let result = (await meta.submitName(0, nameParts));
    let expectedIx = result.logs[0].args["nameIx"].toNumber();
    let actualIx = (await meta.getNameIndex.call(0, nameParts)).toNumber();

    assert.equal(actualIx, expectedIx);
  });

  it("new names have index values larger than 0", async function() {
    let nameParts = [
      web3.fromAscii("00000000000000000000000000000000"), 
      web3.fromAscii("10000000000000000000000000000000")
    ];

    let nameType = 0;
    
    let result = (await meta.submitName(nameType, nameParts));
    let nameIx = result.logs[0].args["nameIx"];
    
    assert.notEqual(nameIx, 0, "New name can not have index 0");
  });
});
