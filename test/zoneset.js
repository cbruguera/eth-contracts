var ZoneSet = artifacts.require("./ZoneSet.sol");

contract('ZoneSet', function(accounts) {
  it("has no url for new addresses", function() {
    var meta;
    
    return ZoneSet.deployed().
      then(function(instance) { meta = instance; }).
      then(function() {
        return meta.addressHasUrl.call(accounts[0]);
      }).then(function(result) {
        assert.equal(result, false);
      });
  });

  it("allows setting and retrieving a URL", function() {
    var meta;
    
    return ZoneSet.deployed().
      then(function(instance) { meta = instance; }).
      then(function() {
        return meta.updateUrl("http://uri", {from: accounts[0]});
      }).then(function(result) {
        assert.equal(result.logs[0].event, "UrlUpdated", "Expected Error event");
        assert.equal(result.logs[0].args["sender"], accounts[0]);
        assert.equal(result.logs[0].args["newUrl"], "http://uri");
        
        return meta.addressHasUrl.call(accounts[0]);
      }).then(function(addressHasUrl) {
        assert.equal(addressHasUrl, true);
        return meta.urlForAddress.call(accounts[0]);
      }).then(function (urlForAddress) {
        assert.equal(urlForAddress, "http://uri");
      });
  });
});
