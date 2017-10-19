pragma solidity ^0.4.15;

import './Destroyable.sol';

contract KeyProofs is Destroyable {

    event MadeChallengeV1(bytes32 indexed uuid, address validator, uint timestamp);
    
    // TODO: switch h with v, so they h+signerAddr can be packed together
    event GotProofV1(bytes32 indexed uuid, address signerAddr, uint8 v, bytes32 h, bytes32 r, bytes32 s);

    event GotSealV1(bytes32 indexed uuid, uint level);
    
    function KeyProofs() {
        
    }

    struct ChallengeV1 {
        address validatorAddr;
        uint timestamp; // can this be extracted from block on client-side?

        ResponseV1 response;
    }

    struct ResponseV1 {
        bytes32 hash;
        
        // These 2 are meant only to signal that hash verification is out-of-scope,
        // and that we only verify if the signature itself corresponds to the
        // responderAddr
        bool hashVerified;  
        bool signatureVerified; 
        // -------------

        uint8 v;
        bytes32 r;
        bytes32 s;
        address responderAddr;
    }

    mapping (bytes32 => ChallengeV1) challengesV1;

    struct SealSetV1 {
        mapping (address => uint) validatorToStorageLevel;
        address[] registeredValidatorAddresses;
    }
    mapping (address => SealSetV1) sealsV1;

    function getChallenge(bytes32 uuid) constant returns(address validatorAddr, uint timestamp) {
        assert(challengesV1[uuid].timestamp != 0); 

        return (challengesV1[uuid].validatorAddr, challengesV1[uuid].timestamp);
    }

    function isValidatedBy(address subject, address validator) constant returns(bool) {
        return sealsV1[subject].validatorToStorageLevel[validator] != 0;
    }

    function sealProof(bytes32 uuid, uint keyStorageLevel) {
        ChallengeV1 memory challenge = challengesV1[uuid];

        assert(challenge.validatorAddr == msg.sender);
        assert(challenge.response.signatureVerified);

        SealSetV1 storage seals = sealsV1[challenge.response.responderAddr];

        assert(seals.validatorToStorageLevel[msg.sender] == 0);
        
        assert(keyStorageLevel > 0);
        seals.validatorToStorageLevel[msg.sender] = keyStorageLevel;
        seals.registeredValidatorAddresses.push(msg.sender);

        GotSealV1(uuid, keyStorageLevel);
    }

    function getSealCount(address addr) constant returns(uint) {
        return sealsV1[addr].registeredValidatorAddresses.length;
    }

    // This should be used to verify if validator has actually performed key verification
    function getSealBy(address userAddr, address validatorAddr) constant returns (uint) {
        return sealsV1[userAddr].validatorToStorageLevel[validatorAddr];
    }

    function getSealAt(address addr, uint sealIx) constant returns (address, uint) {
        address validatorAddr = sealsV1[addr].registeredValidatorAddresses[sealIx];

        return (validatorAddr, sealsV1[addr].validatorToStorageLevel[validatorAddr]);
    }

    function getSignerAndSignatureInput(bytes32 uuid) constant returns(address, bytes32) {
        ChallengeV1 memory challenge = challengesV1[uuid];

        assert(challenge.validatorAddr == msg.sender);
        assert(challenge.response.signatureVerified);

        return (challenge.response.responderAddr, challenge.response.hash);
    }
    
    function requestProof(bytes32 uuid) {
        assert(challengesV1[uuid].timestamp == 0);

        ResponseV1 memory emptyResponse;
        challengesV1[uuid] = ChallengeV1(msg.sender, block.timestamp, emptyResponse);
        MadeChallengeV1(uuid, msg.sender, block.timestamp);
    }

    function submitProofEC(bytes32 uuid, address signerAddr, uint8 v, bytes32 h, bytes32 r, bytes32 s)
    {
        submitProof(uuid, signerAddr, v, h, r, s);
    }

    function submitProofRSA(bytes32 uuid, bytes32[] publicKey, bytes32[] signature)
    {
        assert(false);
    }

    function submitProof(bytes32 uuid, address signerAddr, uint8 v, bytes32 h, bytes32 r, bytes32 s) private
    {
        assert(challengesV1[uuid].timestamp != 0); // challenge has been made
        assert(challengesV1[uuid].response.responderAddr == address(0x0)); // but it has no response yet

        assert(verify(signerAddr, v, h, r, s));
        
        GotProofV1(uuid, signerAddr, v, h, r, s);
        challengesV1[uuid].response = ResponseV1(h, false, true, v, r, s, signerAddr);
    }

    function verify(address p, uint8 v, bytes32 hash, bytes32 r, bytes32 s) internal constant returns(bool) {
        
        bool result = (ecrecover(hash, v, r, s) == p);

        if (!result) {
            // was signed via Geth eth_sign
            // truffle tests sign using eth_sign of the backing node
            // so without this, tests need to be able to detect testrpc / geth somehow
            bytes memory prefix = "\x19Ethereum Signed Message:\n32";
            bytes32 prefixedHash = sha3(prefix, hash);
            result = (ecrecover(prefixedHash, v, r, s) == p);
        }

        return result;
    }
 }