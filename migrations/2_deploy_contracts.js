// var TestContract = artifacts.require("./TestContract.sol");
// var AddressSet = artifacts.require("./AddressSet.sol");
// var ZoneSet = artifacts.require("./ZoneSet.sol");
var KeyProofs = artifacts.require("./KeyProofs.sol");
var ClaimRegistry = artifacts.require("./ClaimRegistry.sol");
var NameStorageLib = artifacts.require("./NameStorageLib.sol");
var NameStorageFacade = artifacts.require("./NameStorageFacade.sol");
// var BaseNameStorage = artifacts.require("./BaseNameStorage.sol");


module.exports = function(deployer) {
  deployer.deploy(NameStorageLib);
  deployer.link(NameStorageLib, NameStorageFacade);
  deployer.deploy(KeyProofs);
  deployer.deploy(NameStorageFacade);
  
  deployer.then(_ => deployer.deploy(ClaimRegistry, KeyProofs.address, NameStorageFacade.address));
};
