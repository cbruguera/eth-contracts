pragma solidity ^0.4.15;

import './NameStorageLib.sol';

contract NameStorageFacade {

    using NameStorageLib for NameStorageLib.Store;
    mapping (uint => NameStorageLib.Store) nameTypeToStore;

    event GotName(bytes32 indexed nameHash, uint nameIx, uint nameType);

    function getNameChunkCount(uint nameType, uint ix) public constant returns (uint) {
        return nameTypeToStore[nameType].getNameChunkCount(ix);
    }

    function getNameCount(uint nameType) public constant returns (uint) {
        return nameTypeToStore[nameType].getNameCount();
    }

    function getNameChunkAt(uint nameType, uint ix, uint chunkIndex) public constant returns (bytes32) {
        return nameTypeToStore[nameType].getNameChunkAt(ix, chunkIndex);
    }

    function getNameIndex(uint nameType, bytes32[] schemaNameParts) public constant returns (int) {
        return nameTypeToStore[nameType].getNameIndex(schemaNameParts);
    }

    function submitName(uint nameType, bytes32[] schemaNameParts) public {
        var (keccak256Val, newIx) = nameTypeToStore[nameType].submitName(schemaNameParts);
        GotName(keccak256Val, newIx, nameType);
    }

    function doThrow() private pure {
        assert(false);
    }
 }