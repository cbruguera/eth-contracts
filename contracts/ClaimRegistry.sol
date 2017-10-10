pragma solidity ^0.4.15;

contract ClaimRegistry {

    address _keyProofsAddr;

    function ClaimRegistry(address keyProofs) {
        _keyProofsAddr = keyProofs;
    }

    event GotSchemaNameV1(bytes32 indexed nameHash, uint ix);
    event GotClaimNameV1(bytes32 indexed nameHash, uint ix);
    event GotClaimV1(address indexed subject, uint schemaIx, uint claimIx, bytes32 urlHash);

    struct NameChunksV1 {
        mapping (uint => bytes32) chunks;
        uint chunkCount;
    }

    mapping (uint => bytes32[]) schemaIxToName;
    mapping (uint => bytes32[]) claimIxToName;
    
    uint schemaNameCount;
    uint claimNameCount;

    // struct ClaimV1 {
    //     address issuer;
    //     bytes url;
    // }

    struct ClaimSetV1 {
        bytes[] urls;
        address[] issuers;
        bool isValid;
    }

    mapping (address => mapping(uint => mapping(uint => ClaimSetV1))) subjectToSchemaToClaimToValues;
    mapping (address => mapping(uint => uint[])) subjectSchemaClaimIndexes; 
    mapping (address => uint[]) subjectSchemaIndexes;

    function getSubjectSchemaCount(address subject) constant returns (uint) {
        return subjectSchemaIndexes[subject].length;
    }

    function getSubjectSchemaClaimCount(address subject, uint schemaNameIx) constant returns (uint) {
        return subjectSchemaClaimIndexes[subject][schemaNameIx].length;
    }

    function getSubjectSchemaAt(address subject, uint ix) constant returns (uint) {
        return subjectSchemaIndexes[subject][ix];
    }

    function getSubjectSchemaClaimAt(address subject, uint schemaNameIx, uint ix) constant returns (uint) {
        return subjectSchemaClaimIndexes[subject][schemaNameIx][ix];
    }

    function getSubjectClaimSetSize(address subject, uint schemaNameIx, uint claimNameIx) constant returns (uint) {
        return subjectToSchemaToClaimToValues[subject][schemaNameIx][claimNameIx].urls.length;
    }

    function getSubjectClaimSetEntryChunk(address subject, uint schemaNameIx, uint claimNameIx, uint claimIx, uint urlChunkIx) constant returns (address issuer, bytes32 urlChunk)
    {
        issuer = subjectToSchemaToClaimToValues[subject][schemaNameIx][claimNameIx].issuers[claimIx];
        bytes memory url = subjectToSchemaToClaimToValues[subject][schemaNameIx][claimNameIx].urls[claimIx];
        
        urlChunk = extract(url, urlChunkIx);
    }

    function submitClaim(address subject, uint schemaIx, uint claimIx, bytes32[] urlParts) {
        // TODO: claimregistry doesnt query keyproofs

        if (subjectToSchemaToClaimToValues[subject][schemaIx][claimIx].isValid == false) {
            subjectToSchemaToClaimToValues[subject][schemaIx][claimIx].isValid = true;
            subjectSchemaIndexes[subject].push(schemaIx);
            subjectSchemaClaimIndexes[subject][schemaIx].push(claimIx);
        }

        bytes memory url = bytes32ArrayToBytes(urlParts);
        subjectToSchemaToClaimToValues[subject][schemaIx][claimIx].urls.push(url);
        subjectToSchemaToClaimToValues[subject][schemaIx][claimIx].issuers.push(msg.sender);

        GotClaimV1(subject, schemaIx, claimIx, sha3(url));
    }

    function getSchemaNameCount() constant returns (uint) {
        return schemaNameCount;
    }

    function getSchemaNameChunkAt(uint ix, uint chunkIndex) constant returns (bytes32) {
        return schemaIxToName[ix][chunkIndex];
    }

    function getClaimNameChunkAt(uint ix, uint chunkIndex) constant returns (bytes32) {
        return claimIxToName[ix][chunkIndex];
    }

    function getClaimNameChunkCount(uint ix) constant returns (uint) {
        return claimIxToName[ix].length;
    }

    function getSchemaNameIndex(bytes32[] schemaNameParts) constant returns (int) {
        bytes memory schemaName = bytes32ArrayToBytes(schemaNameParts);
        for (uint i = 0; i < schemaNameCount; ++i) {
            bytes memory currentSchemaName = bytes32ArrayToBytes(schemaIxToName[i]);
            if (sha3(currentSchemaName) == sha3(schemaName)) {
                return int(i);
            }
        }
        return -1;
    }

    function submitSchemaName(bytes32[] schemaNameParts) {
        require(getSchemaNameIndex(schemaNameParts) == -1);

        var newIx = schemaNameCount;
        schemaNameCount += 1;

        schemaIxToName[newIx] = schemaNameParts;

        bytes memory schemaName = bytes32ArrayToBytes(schemaNameParts);
        GotSchemaNameV1(sha3(schemaName), newIx);
    }

    function getClaimNameCount() constant returns (uint) {
        return claimNameCount;
    }

    function getClaimNameIndex(bytes32[] claimNameParts) constant returns (int) {
        bytes memory claimName = bytes32ArrayToBytes(claimNameParts);
        for (uint i = 0; i < claimNameCount; ++i) {
            bytes memory currentClaimName = bytes32ArrayToBytes(claimIxToName[i]);
            
            if (sha3(currentClaimName) == sha3(claimName)) {
                return int(i);
            }
        }
        return -1;
    }

    function submitClaimName(bytes32[] claimNameParts) {
        require(getClaimNameIndex(claimNameParts) == -1);

        var newIx = claimNameCount;
        claimNameCount += 1;

        claimIxToName[newIx] = claimNameParts;
        
        bytes memory claimName = bytes32ArrayToBytes(claimNameParts);
        GotClaimNameV1(sha3(claimName), newIx);
    }

    // function getSchemaNameChunk(address subject, uint schemaIndex, uint chunkIndex) constant returns (bytes32) {
    //     return extract(subjectData[subject].schemas[schemaIndex].name, chunkIndex);
    // }

    // function submitClaim(address subject, bytes32[] schemaNameParts, bytes32[] claimNameParts, address validator, bytes32[] urlData) {
    //     bytes memory schemaName = bytes32ArrayToBytes(schemaNameParts);
    //     bytes memory claimName = bytes32ArrayToBytes(claimNameParts);
    //     bytes memory claimValue = bytes32ArrayToBytes(urlData);

    //     SubjectData storage subjData = subjectData[subject];
    //     uint subjectSchemaIx = subjData.schemaNamesToIndex[schemaName];
        
    //     if (subjectSchemaIx == 0) {
    //         subjectSchemaIx = subjData.schemaIndexes.length + 1;
    //         subjData.schemaIndexes.push(subjectSchemaIx);
    //         subjData.schemaNamesToIndex[schemaName] = subjectSchemaIx;
            
    //         SchemaData storage sd;
    //         subjData.schemas[subjectSchemaIx] = sd;
    //     }

    //     SchemaData memory schemaData = subjData.schemas[subjectSchemaIx];
    //     uint storage claimIx = schemaData.claimNamesToIndex[claimName];
    //     if (claimIx == 0) {
    //         claimIx = schemaData.claimIndexes.length + 1;
    //         schemaData.claimIndexes.push(claimIx);
    //         schemaData.claimNamesToIndex[claimName] = claimIx;

    //         ClaimData storage cd;
    //         schemaData.claims[claimIx] = cd;
    //     }

    //     ClaimData memory claimData = schemaData.claims[claimIx];
    //     uint valueIx = claimData.issuerToIndex[msg.sender];
    //     require (valueIx == 0);

    //     valueIx = claimData.valueIndexes.length + 1;
    //     claimData.claimValue[valueIx] = claimValue;
    //     claimData.issuerToIndex[msg.sender] = valueIx;
    //     claimData.valueIndexes.push(valueIx);
    // }

    function extract(bytes data, uint chunk) constant returns (bytes32 result)
    { 
        for (uint i=0; i<32;i++) {
            result^=(bytes32(0xff00000000000000000000000000000000000000000000000000000000000000)&data[i+chunk*32])>>(i*8);
        }
    }
    
    function bytes32ArrayToBytes (bytes32[] data) constant returns (bytes) {
        bytes memory bytesString = new bytes(data.length * 32);
        uint urlLength;
        for (uint i=0; i<data.length; i++) {
            for (uint j=0; j<32; j++) {
                byte char = byte(bytes32(uint(data[i]) * 2 ** (8 * j)));
                if (char != 0) {
                    bytesString[urlLength] = char;
                    urlLength += 1;
                }
            }
        }
        bytes memory bytesStringTrimmed = new bytes(urlLength);
        for (i=0; i<urlLength; i++) {
            bytesStringTrimmed[i] = bytesString[i];
        }
        return bytesStringTrimmed;
    }

    function getKeyProofsAddress() constant returns(address) {
        return _keyProofsAddr;
    }

    function doThrow() {
        assert(false);
    }
 }