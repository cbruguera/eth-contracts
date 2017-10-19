# KYC Exchange Smart Contracts

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
