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
        address[] linkedAddresses;
        mapping (uint => bytes32) linkHashMaps;
    }

    mapping (address => mapping(uint => mapping(uint => ClaimSetV1))) subjectToTypeToAttrToClaims;
    mapping (address => mapping(uint => uint[])) subjectTypeClaimIndexes; 
    mapping (address => uint[]) subjectTypeIndexes;
    //       subject            linked adderess => proof hash
    mapping (address => Linkages) subjectLinkages;

    function getLinkageCount(address subject) public view returns(uint linkageCount) {
        // var isSelf = (msg.sender == subject);
        linkageCount = subjectLinkages[subject].linkedAddresses.length;
        return linkageCount;
    }

    function getLinkageIndex(address subject, address linkedAddress) private view returns(int) {
        for (uint i = 0 ; i < subjectLinkages[subject].linkedAddresses.length ; i++ ){
            if(subjectLinkages[subject].linkedAddresses[i] == linkedAddress){
                return int( i );
            }
            i++;
        }

        return -1;
    }

    function getLinkages(address subject) public view returns(address[] linkedAddresses) {
        // var isSelf = (msg.sender == subject);
        linkedAddresses = subjectLinkages[subject].linkedAddresses;
    }

    function getLinkagesWithProofs(address subject) public view returns( address[] memory addrLinks, bytes32[] memory proofHashes ) {
        uint _arrLength = subjectLinkages[subject].linkedAddresses.length;
        address[] memory _addrLinks = new address[](_arrLength);
        bytes32[] memory _proofHashes = new bytes32[](_arrLength);

        for (uint i = 0 ; i < subjectLinkages[subject].linkedAddresses.length ; i++ ){
            _proofHashes[i] = subjectLinkages[subject].linkHashMaps[i];
            _addrLinks[i] = subjectLinkages[subject].linkedAddresses[i];
        }

        return (_addrLinks , _proofHashes);
    }



    function submitLinkage(address linkedAddress, bytes32 txHash) public returns(uint linkageCount) {
        // var isSelf = (msg.sender == subject);

        // require(isSelf);
        address subject = msg.sender;

        // uint8 v, bytes32 r, bytes32 s
        // bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        // bytes32 prefixedHash = keccak256(prefix, txHash);
        // address signer = ecrecover(prefixedHash, v, r, s);

        // require(linkedAddress == signer);

        require(getLinkageIndex(subject, linkedAddress) == -1);

        linkageCount = getLinkageCount(subject);
        
        subjectLinkages[subject].linkedAddresses.push(linkedAddress);
        subjectLinkages[subject].linkHashMaps[(linkageCount)] = txHash;
        linkageCount++;

        GotLinkage(subject, linkedAddress, txHash, linkageCount);     
    }

    function terminateLinkage(address linkedAddress) public returns(uint linkageCount) {
        address subject = msg.sender;

        bytes32 emptyVar;
        require(getLinkageIndex(subject, linkedAddress) >= 0);
        
        linkageCount = getLinkageCount(subject);
        
        address[] memory newLinkages;
        uint i = 0; 
        uint delIndex = 0;
        while (i < newLinkages.length){
            if(newLinkages[i] == linkedAddress){
                delIndex = i;
                continue;
            } 
            newLinkages[i] = subjectLinkages[subject].linkedAddresses[i];
            i++;
        }

        subjectLinkages[subject].linkedAddresses = newLinkages;
        subjectLinkages[subject].linkHashMaps[delIndex] = emptyVar;
        linkageCount--;

        TerminatedLinkage(subject, linkedAddress, linkageCount);

        // return linkageCount;
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