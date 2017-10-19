# KYC Exchange Smart Contracts

## Accessing ABI for specific version

    # Get latest version
    VERSION="$(curl https://raw.githubusercontent.com/notakey-kyc/eth-contracts/master/VERSION)"
    echo "Version: $VERSION"

    # Get ABI for specific contract
    CONTRACT_NAME="ClaimRegistry"
    wget "https://raw.githubusercontent.com/notakey-kyc/eth-contracts/master/abi_archive/$VERSION/${CONTRACT_NAME}.json"

## rinkeby

Main test account: d46c9b407afa991c4c510ab5ebf8959ea7409c17
