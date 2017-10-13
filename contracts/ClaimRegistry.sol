pragma solidity ^0.4.15;

import './NameStorageFacade.sol';
import './KeyProofs.sol';

contract ClaimRegistry {

    // type indices
    uint constant TYPE_TIX = 0; 
    uint constant ATTR_TIX = 1; 
    uint constant URL_TIX = 2; 

    address _keyProofsAddr;
    address _nameStorageFacade;

    function ClaimRegistry(address keyProofs, address nameStorageFacade) {
        _keyProofsAddr = keyProofs;
        _nameStorageFacade = nameStorageFacade;
    }

    event GotClaim(address indexed subject, uint typeIx, uint attrIx, uint urlIx);

    struct ClaimSetV1 {
        uint[] urls;
        address[] issuers;
        bool isValid;
    }

    mapping (address => mapping(uint => mapping(uint => ClaimSetV1))) subjectToTypeToAttrToClaims;
    mapping (address => mapping(uint => uint[])) subjectTypeClaimIndexes; 
    mapping (address => uint[]) subjectTypeIndexes;

    function submitClaim(address subject, uint typeIx, uint attrIx, uint urlIx) {
        var isSelf = (msg.sender == subject);
        var isValidator = KeyProofs(_keyProofsAddr).isValidatedBy(subject, msg.sender);

        require(isSelf || isValidator);

        require(typeIx > 0);
        require(attrIx > 0);
        require(urlIx > 0);

        // type/attr/url exists
        require(NameStorageFacade(_nameStorageFacade).getNameCount(TYPE_TIX) >= typeIx);
        require(NameStorageFacade(_nameStorageFacade).getNameCount(ATTR_TIX) >= attrIx);
        require(NameStorageFacade(_nameStorageFacade).getNameCount(URL_TIX) >= urlIx);

        if (subjectToTypeToAttrToClaims[subject][typeIx][attrIx].isValid == false) {
            subjectToTypeToAttrToClaims[subject][typeIx][attrIx].isValid = true;
            subjectTypeIndexes[subject].push(typeIx);
            subjectTypeClaimIndexes[subject][typeIx].push(attrIx);
        }
        
        subjectToTypeToAttrToClaims[subject][typeIx][attrIx].urls.push(urlIx);
        subjectToTypeToAttrToClaims[subject][typeIx][attrIx].issuers.push(msg.sender);

        GotClaim(subject, typeIx, attrIx, urlIx);
     }


    function getSubjectTypeCount(address subject) constant returns (uint) {
        return subjectTypeIndexes[subject].length;
    }

    function getSubjectTypeAttrCount(address subject, uint typeNameIx) constant returns (uint) {
        return subjectTypeClaimIndexes[subject][typeNameIx].length;
    }

    function getSubjectTypeAt(address subject, uint ix) constant returns (uint) {
        return subjectTypeIndexes[subject][ix];
    }

    function getSubjectTypeAttrAt(address subject, uint typeNameIx, uint ix) constant returns (uint) {
        return subjectTypeClaimIndexes[subject][typeNameIx][ix];
    }

    function getSubjectClaimSetSize(address subject, uint typeNameIx, uint attrNameIx) constant returns (uint) {
        return subjectToTypeToAttrToClaims[subject][typeNameIx][attrNameIx].urls.length;
    }

    function getSubjectClaimSetEntryChunk(address subject, uint typeNameIx, uint attrNameIx, uint attrIx) constant returns (address issuer, uint url)
    {
        issuer = subjectToTypeToAttrToClaims[subject][typeNameIx][attrNameIx].issuers[attrIx];
        url = subjectToTypeToAttrToClaims[subject][typeNameIx][attrNameIx].urls[attrIx];
    }

    function getKeyProofsAddress() constant returns(address) {
        return _keyProofsAddr;
    }

    function doThrow() {
        assert(false);
    }
 }