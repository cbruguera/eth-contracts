var NameStorageFacade = artifacts.require("./NameStorageFacade.sol");
var BaseNameStorage = artifacts.require("./BaseNameStorage.sol");
var Web3Utils = require('web3-utils');

const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }

      resolve(res);
    })
  );

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

  it("reports the correct name count", async function() {
    let meta = await NameStorageFacade.deployed();

    await meta.ensureCanStore(10);
    
    let count = (await meta.getNameCount.call(10)).toNumber();
    assert.equal(count, 0);

    await meta.submitName(10, [web3.fromAscii("test")]);
    
    let count2 = (await meta.getNameCount.call(10)).toNumber();
    assert.equal(count2, 1);
  });

  it("can get index based on name", async function() {
    let meta = await NameStorageFacade.deployed();
    let asciiName = "http://schema.org/yo";
    let nameParts = [web3.fromAscii(asciiName)];
    
    await meta.ensureCanStore(0);

    let bnsAddress = await meta.requireNameTypeAddress(0);
    let bns = BaseNameStorage.at(bnsAddress);

    let result = (await meta.submitName(0, nameParts));
    let actualIx = (await meta.getNameIndex.call(0, nameParts)).toNumber();

    let filter = bns.GotName({nameHash: 
      Web3Utils.soliditySha3(asciiName)}, {fromBlock: result.receipt.blockNumber, toBlock: 'latest'});
      
    let event = await new Promise(function(resolve, reject) {  
      filter.get((err, events) => {
        assert.equal(err, null);
        resolve(events[0]);
      });
    });
    
    let expectedIx = event.args["nameIx"];
    assert.equal(actualIx, expectedIx);
  });

  it("new names have index values larger than 0", async function() {
    let meta = await NameStorageFacade.deployed();
    let nameParts = [
      web3.fromAscii("00000000000000000000000000000000"), 
      web3.fromAscii("10000000000000000000000000000000")
    ];

    let nameType = 0;
    await meta.ensureCanStore(nameType);

    let bnsAddress = await meta.requireNameTypeAddress(nameType);
    let bns = BaseNameStorage.at(bnsAddress);

    let asciiName = "0000000000000000000000000000000010000000000000000000000000000000";

    let result = (await meta.submitName(nameType, nameParts));
    let filter = bns.GotName({}, {fromBlock: result.receipt.blockNumber, toBlock: 'latest'});
      
    let nameIx = await new Promise(function(resolve, reject) {  
      filter.get((err, events) => {
        assert.equal(err, null);
        resolve(events[0].args["nameIx"]);
      });
    });
    
    assert.notEqual(nameIx, 0, "New name can not have index 0");
  });
});