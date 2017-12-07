# KYC Exchange Smart Contracts

**Use scripts/test.sh for testing!**

## Interacting with the crowdsale in Truffle console

    truffle console

then

    // USER WILL NOT BE ABLE TO SUBMIT UNLESS
    // 'idp' ISSUES A SEAL + 2 CLAIMS FOR 'user'

    // Variable setup
    idp = web3.eth.accounts[0]
    user = web3.eth.accounts[1]
    SecondPriceAuction.deployed().then(inst => {crowdsale = inst} )
    IcoPassToken.deployed().then(inst => {token = inst})

    // Signing the statement
    var statement = web3.fromAscii("Please take my Ether and try to build Polkadot.");
    var signatureHexString = web3.eth.sign(user, statement);
    var r = '0x' + signatureHexString.slice(2, 66) // 64
    var s = '0x' + signatureHexString.slice(66, 130) // 64
    var v = web3.toDecimal('0x' + signatureHexString.slice(130, 132)) 
    
    // THIS IS ONLY REQUIRED FOR TESTRPC
    v += 27 
    
    // Now buy
    crowdsale.buyin(v,r,s,{from:user, value: web3.toWei(1, "ether")})

    // Get the crowdsale verifier
    crowdsale.verifier().then(inst => vaddr = inst)
    NotakeyVerifierV1.at(vaddr).then(inst => verifier = inst)

    // Verify
    verifier.isVerified(idp, verifier.USA() | verifier.CHINA() | verifier.SOUTH_KOREA()) 
    verifier.isVerified(user, verifier.USA() | verifier.CHINA() | verifier.SOUTH_KOREA()) 


## Truffle version

    truffle@4.0.1

If (after truffle up/downgrades) there are unexpected Web3 errors (e.g.
invalid number of arguments passed to Solidity function, despite it being
a read-property call), try:

    rm -r build
    truffle migrate --reset --compile-all

## Dependencies for the crowdsale and token contracts

    npm install zeppelin-solidity

## Dependencies for devresolver

    brew tap iveney/mocha
    brew install realpath jq

## Test Reporter

See: https://github.com/cgewecke/eth-gas-reporter

  // Truffle installed globally
  npm install -g eth-gas-reporter
 
  // Truffle installed locally (ProTip: This always works.)
  npm install --save-dev eth-gas-reporter

and add to truffle.js

    mocha: {
        reporter: 'eth-gas-reporter'
    }
    
## Web3 utils

    Error: Cannot find module 'web3-utils'

```
cd /project/root/dir
npm uninstall web3-utils
```

## Accessing ABI for a specific version

    # Get the latest version
    VERSION="$(curl https://raw.githubusercontent.com/notakey-kyc/eth-contracts/master/VERSION)"
    echo "Version: $VERSION"

    # Get the ABI for specific contract
    CONTRACT_NAME="ClaimRegistry"
    wget "https://raw.githubusercontent.com/notakey-kyc/eth-contracts/master/abi_archive/$VERSION/${CONTRACT_NAME}.json"

## Accessing addresses for a specific version

    # Get the latest version
    VERSION="$(curl https://raw.githubusercontent.com/notakey-kyc/eth-contracts/master/VERSION)"

    # Set the network
    NETWORK=rinkeby

    wget "https://raw.githubusercontent.com/notakey-kyc/eth-contracts/master/address_archive/$VERSION/$NETWORK.json"

## rinkeby

Main test account: d46c9b407afa991c4c510ab5ebf8959ea7409c17
