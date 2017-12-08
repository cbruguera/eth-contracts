pragma solidity ^0.4.15;

import './NameStorageFacade.sol';
import './KeyProofs.sol';
import './Destroyable.sol';

contract ClaimRegistry is Destroyable {

    // type indices
    uint constant TYPE_TIX = 0; 
    uint constant ATTR_TIX = 1; 
    uint constant URL_TIX = 2; 

    address _keyProofsAddr;
    address _nameStorageFacade;

    event TerminatedLinkage(address indexed subject, address indexed linkedAddress, uint linkCount);
    
    event GotLinkage(address indexed subject, address indexed linkedAddress, bytes32 proofHash, uint linkCount);
    
    event GotClaim(address indexed subject, uint typeIx, uint attrIx, uint urlIx);


    function ClaimRegistry(address keyProofs, address nameStorageFacade) {
        _keyProofsAddr = keyProofs;
        _nameStorageFacade = nameStorageFacade;
    }   
    
    struct ClaimSetV1 {
        uint[] urls;
        address[] issuers;
        bool isValid;
    }

    struct Linkages{
        mapping (address => bytes32) linkHashMaps;
        uint linkCount;
    }

    mapping (address => mapping(uint => mapping(uint => ClaimSetV1))) subjectToTypeToAttrToClaims;
    mapping (address => mapping(uint => uint[])) subjectTypeClaimIndexes; 
    mapping (address => uint[]) subjectTypeIndexes;
    //       subject            linked adderess => proof hash
    mapping (address => Linkages) subjectLinkages;

    function getLinkageCount(address subject) public view returns(uint) {
        // var isSelf = (msg.sender == subject);
        var curCnt = subjectLinkages[subject].linkCount;
        return curCnt;
    }

    function submitLinkage(address linkedAddress, bytes32 txHash) public returns(uint length) {
        // var isSelf = (msg.sender == subject);

        // require(isSelf);
        address subject = msg.sender;

        // uint8 v, bytes32 r, bytes32 s
        // bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        // bytes32 prefixedHash = keccak256(prefix, txHash);
        // address signer = ecrecover(prefixedHash, v, r, s);

        // require(linkedAddress == signer);
        bytes32 emptyVar;
        require(subjectLinkages[subject].linkHashMaps[linkedAddress] == emptyVar);

        uint curCnt = getLinkageCount(subject);
        curCnt++;

        subjectLinkages[subject].linkHashMaps[linkedAddress] = txHash;
        subjectLinkages[subject].linkCount = curCnt;

        GotLinkage(subject, linkedAddress, txHash, curCnt);     
        return curCnt;
    }

    function terminateLinkage(address linkedAddress) public returns(uint length) {
        address subject = msg.sender;

        bytes32 emptyVar;
        require(subjectLinkages[subject].linkHashMaps[linkedAddress] != emptyVar);
        
        uint curCnt = getLinkageCount(subject);
        
        subjectLinkages[subject].linkHashMaps[linkedAddress] = emptyVar;
        curCnt--;

        subjectLinkages[subject].linkCount = curCnt;
        TerminatedLinkage(subject, linkedAddress, curCnt);

        return curCnt;
    }

    function submitClaim(address subject, uint typeIx, uint attrIx, uint urlIx) public {
        var isSelf = (msg.sender == subject);
        var isValidator = KeyProofs(_keyProofsAddr).isValidatedBy(subject, msg.sender);

        require(isSelf || isValidator);

        require(typeIx > 0);
        require(attrIx > 0);
        require(urlIx > 0);

        // type/attr/url exists
        require(NameStorageFacade(_nameStorageFacade).getNameCount(TYPE_TIX) >= typeIx);
        require(NameStorageFacade(_nameStorageFacade).getNameCount(ATTR_TIX) >= attrIx);
        
        // Allow non-existant value, so it can be interpreted as an integer not lookup URL
        // require(NameStorageFacade(_nameStorageFacade).getNameCount(URL_TIX) >= urlIx);

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

    function getSubjectClaimSetEntryAt(address subject, uint typeNameIx, uint attrNameIx, uint ix) constant returns (address issuer, uint url)
    {
        issuer = subjectToTypeToAttrToClaims[subject][typeNameIx][attrNameIx].issuers[ix];
        url = subjectToTypeToAttrToClaims[subject][typeNameIx][attrNameIx].urls[ix];
    }

    function getKeyProofsAddress() constant returns(address) {
        return _keyProofsAddr;
    }

    function doThrow() {
        assert(false);
    }
 }