module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "1337" 
    },
    rinkeby: {
      host: "localhost", // Connect to geth on the specified
      port: 8545,
      from: "0xd46c9b407afa991c4c510ab5ebf8959ea7409c17", // default address to use for any transaction Truffle makes during migrations
      network_id: 4,
      gas: 4612388 // Gas limit used for deploys
    }
  }
};
