// var TestContract = artifacts.require("./TestContract.sol");
// var AddressSet = artifacts.require("./AddressSet.sol");
// var ZoneSet = artifacts.require("./ZoneSet.sol");
var KeyProofs = artifacts.require("./KeyProofs.sol");
var ClaimRegistry = artifacts.require("./ClaimRegistry.sol");
var NameStorageLib = artifacts.require("./NameStorageLib.sol");

module.exports = function(deployer) {
  // deployer.deploy(TestContract, 3); 
  // deployer.deploy(AddressSet); 
  // deployer.deploy(ZoneSet); 
  deployer.deploy(KeyProofs);
  deployer.deploy(NameStorageLib);

  // TODO: claimregistry doesnt query keyproofs
  deployer.deploy(ClaimRegistry/*, KeyProofs.address*/);
};
