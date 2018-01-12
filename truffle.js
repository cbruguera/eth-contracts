module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "1337",
      gas: 4612388
    },
    rinkeby: {
      host: "10.0.1.104", // Connect to geth on the specified
      port: 8545,
      from: "0xd46c9b407afa991c4c510ab5ebf8959ea7409c17", // default address to use for any transaction Truffle makes during migrations
      network_id: 4,
      gas: 4612388, // Gas limit used for deploys
      gasPrice: 22000000000 // deployment fix for Contract transaction couldn't be found after 50 blocks
      // https://medium.com/@ncloutierweb/solidity-truffle-not-found-at-block-50-error-solution-3d1a7784f00e 
    }
  },
  mocha: {
      reporter: 'eth-gas-reporter'
  }
};
