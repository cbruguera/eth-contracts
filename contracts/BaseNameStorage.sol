pragma solidity ^0.4.15;

import './NameStorageLib.sol';

contract BaseNameStorage {

    using NameStorageLib for NameStorageLib.Store;
    NameStorageLib.Store store;

    event GotName(bytes32 indexed nameHash, uint nameIx, uint nameType);

    uint nameType;

    function BaseNameStorage(uint _nameType) {
        nameType = _nameType;
    }
    
    function getNameCount() constant returns (uint) {
        return store.getNameCount();
    }

    function getNameChunkAt(uint ix, uint chunkIndex) constant returns (bytes32) {
        return store.getNameChunkAt(ix, chunkIndex);
    }

    function getNameIndex(bytes32[] schemaNameParts) constant returns (int) {
        return store.getNameIndex(schemaNameParts);
    }

    function submitName(bytes32[] schemaNameParts) {
        var (keccak256Val, newIx) = store.submitName(schemaNameParts);
        GotName(keccak256Val, newIx, nameType);
    }

    function doThrow() {
        assert(false);
    }
 }