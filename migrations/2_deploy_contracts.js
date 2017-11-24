var KeyProofs = artifacts.require("./KeyProofs.sol");var KeyProofs = artifacts.require("./KeyProofs.sol");
var AddressSet = artifacts.require("./AddressSet.sol");
var ClaimRegistry = artifacts.require("./ClaimRegistry.sol");
var NameStorageLib = artifacts.require("./NameStorageLib.sol");
var NameStorageFacade = artifacts.require("./NameStorageFacade.sol");
var TestVerifier = artifacts.require("./TestVerifier.sol");

module.exports = function(deployer) {
  deployer.deploy(NameStorageLib);
  deployer.link(NameStorageLib, NameStorageFacade);
  deployer.deploy(KeyProofs);
  deployer.deploy(NameStorageFacade);
  deployer.deploy(AddressSet);
  
  deployer.then(_ => deployer.deploy(ClaimRegistry, KeyProofs.address, NameStorageFacade.address));
  deployer.then(_ => deployer.deploy(TestVerifier, ClaimRegistry.address));

  deployer.then(async _ => {
    let nsf = await NameStorageFacade.deployed();

    [
      "http://schema.org/Person",               // 1:0
      "http://schema.org/Organization",         // 2:0
      "http://kyc.notakey.com/PublicKey",       // 3:0
      "http://kyc.notakey.com/Subject",         // 4:0
      "http://kyc.notakey.com/Validator",       // 5:0
      "http://kyc.notakey.com/IcoContributor"   // 6:0
    ].forEach(async function( schemaName) {
      let parts = schemaName.match(/.{1,32}/g);
      let encodedParts = parts.map(x => web3.fromAscii(x));
      await nsf.submitName(0, encodedParts);
      console.log("Submitted schema " + schemaName);
    });

    [
      "name",             // 1:1
      "keyBlob",          // 2:1
      "keyType",          // 3:1
      "encryptionKey",    // 4:1
      "passportPicture",  // 5:1
      "reportBundleV1",   // 6:1
      "nationalityIndex"  // 7:1
    ].forEach(async function( attrName) {
      let parts = attrName.match(/.{1,32}/g);
      let encodedParts = parts.map(x => web3.fromAscii(x));
      await nsf.submitName(1, encodedParts);
      console.log("Submitted attr " + attrName);
    });

    // test.key
    // 0x5F9508555c8bbD32CfF8aA59774f69AfDF66710E

    
    
  })
};
