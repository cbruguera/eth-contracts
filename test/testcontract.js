var TestContract = artifacts.require("./TestContract.sol");

contract('TestContract', function(accounts) {
  it("should work", function() {
    var meta;
    var metaResult;
  
    meta = TestContract.at("0x851510f70114b0900ccc38cc688ae2886493efac");
    return meta.multiply(5).then(function(result) {
      console.log('Result:', result);
      return meta.multiply.call(6);
    }).then(function(result) {
      metaResult = result.toNumber();
      assert.equal(metaResult, 11);
    });
  });
});
