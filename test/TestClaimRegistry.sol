pragma solidity ^0.4.15;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/TestThrowProxy.sol";
import "../contracts/ClaimRegistry.sol";
import "../contracts/KeyProofs.sol";

contract TestClaimRegistry {

  // this is just a sanity test, to make sure deployment was correct
  function test_getKeyProofsAddress_notEmpty() {
    ClaimRegistry meta = ClaimRegistry(DeployedAddresses.ClaimRegistry());
    Assert.notEqual(meta.getKeyProofsAddress(), address(0x0), "KeyProof address should be set");
  }

  function test_testThrow() {
    ClaimRegistry meta = ClaimRegistry(DeployedAddresses.ClaimRegistry());
    TestThrowProxy metaThrowProxy = new TestThrowProxy(address(meta));

    ClaimRegistry(address(metaThrowProxy)).doThrow();
    bool didThrow = !metaThrowProxy.execute();

    Assert.equal(didThrow, true, "Expected to throw");
  }

}
