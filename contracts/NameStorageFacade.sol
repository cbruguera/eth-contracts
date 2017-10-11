pragma solidity ^0.4.15;

import './BaseNameStorage.sol';

contract NameStorageFacade {

    mapping (uint => address) nameTypeToContract;

    function ensureCanStore(uint nameType) {
        address existingContract = nameTypeToContract[nameType];
        if (existingContract == address(0)) {
            existingContract = new BaseNameStorage(nameType);
            nameTypeToContract[nameType] = existingContract;
        }
    }

    function requireNameTypeAddress(uint nameType) constant returns (address) {
        var result = nameTypeToContract[nameType];
        require (result != address(0));
        return result;
    }

    function getNameCount(uint nameType) constant returns (uint) {
        var bns = BaseNameStorage(requireNameTypeAddress(nameType));
        return bns.getNameCount();
    }

    function getNameChunkAt(uint nameType, uint ix, uint chunkIndex) constant returns (bytes32) {
        var bns = BaseNameStorage(requireNameTypeAddress(nameType));
        return bns.getNameChunkAt(ix, chunkIndex);
    }

    function getNameIndex(uint nameType, bytes32[] schemaNameParts) constant returns (int) {
        var bns = BaseNameStorage(requireNameTypeAddress(nameType));
        return bns.getNameIndex(schemaNameParts);
    }

    function submitName(uint nameType, bytes32[] schemaNameParts) {
        var bns = BaseNameStorage(requireNameTypeAddress(nameType));
        bns.submitName(schemaNameParts);
    }

    function doThrow() {
        assert(false);
    }
 }