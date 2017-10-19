pragma solidity ^0.4.15;

library NameStorageLib {

    struct Store {
        mapping (uint => bytes32[]) ixToName;
        uint nameCount;
    }

    function getNameCount(Store storage self) constant returns (uint) {
        return self.nameCount;
    }

    function getNameChunkCount(Store storage self, uint ix) constant returns (uint) {
        return self.ixToName[ix].length;
    }

    function getNameChunkAt(Store storage self, uint ix, uint chunkIndex) constant returns (bytes32) {
        return self.ixToName[ix][chunkIndex];
    }

    function getNameIndex(Store storage self, bytes32[] schemaNameParts) constant returns (int) {
        bytes memory schemaName = bytes32ArrayToBytes(schemaNameParts);

        // start from 1, because 0 means uninitialized
        for (uint i = 1; i <= self.nameCount; ++i) {
            bytes memory currentSchemaName = bytes32ArrayToBytes(self.ixToName[i]);
            if (keccak256(currentSchemaName) == keccak256(schemaName)) {
                return int(i);
            }
        }
        return -1;
    }

    function submitName(Store storage self, bytes32[] schemaNameParts) returns (bytes32, uint) {
        require(getNameIndex(self, schemaNameParts) == -1);

        var newIx = self.nameCount + 1; // index 0 should mean uninitialized
        self.nameCount += 1;

        self.ixToName[newIx] = schemaNameParts;

        bytes memory schemaName = bytes32ArrayToBytes(schemaNameParts);
        return (keccak256(schemaName), newIx);
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
 }