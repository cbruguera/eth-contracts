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


    function ClaimRegistry(address keyProofs, address nameStorageFacade) public {
        _keyProofsAddr = keyProofs;
        _nameStorageFacade = nameStorageFacade;
        
        // Initialize 0 index with empty  value to start valid indexes from 1
        address a;
        globalAddressIndex.push(a);
    }   
    
    struct ClaimSetV1 {
        uint[] urls;
        address[] issuers;
        bool isValid;
    }

    struct Linkages{
        uint[] linkedAddressesIx;
        mapping (uint => bytes32) linkHashMaps;
    }


    mapping (address => mapping(uint => mapping(uint => ClaimSetV1))) subjectToTypeToAttrToClaims;
    mapping (address => mapping(uint => uint[])) subjectTypeClaimIndexes; 
    mapping (address => uint[]) subjectTypeIndexes;
    
    //   subjectIx => linkIx[]
    mapping (uint => Linkages)  subjectIxTolinkedAddrIx; 
    //   linkedAddressIx => subjectIx[]
    mapping (uint => uint[])  linkedAddrIxToSubjectIx; 
   
    address[] globalAddressIndex;
    mapping (address => uint) globalAddressHelper;


    function getLinkageCount(address subject) public view returns(uint linkageCount) {
       
        uint sIx = _laddrGetIx(subject);

        require(sIx > 0);
        
        return _linkCountByIx(sIx);
    }

    
    function _linkCountByIx( uint sIx) public view returns(uint linkCount) {
        return subjectIxTolinkedAddrIx[sIx].linkedAddressesIx.length;
    }

    function _laddrAddOrGetIx(address myAddress) private returns (uint laddrIx) {
        laddrIx = _laddrGetIx(myAddress);

        if(laddrIx > 0){
            return laddrIx;
        }

        laddrIx = globalAddressIndex.length;

        globalAddressHelper[myAddress] = laddrIx;
        globalAddressIndex.push(myAddress);
    }

    function _laddrRemove(address myAddress) private {
        uint lIx = _laddrGetIx(myAddress);

        require(lIx > 0);

        globalAddressHelper[myAddress] = 0; 
        delete(globalAddressIndex[lIx]);
    }

    function _laddrGetIx(address myAddress) private view returns (uint laddrIx){
        
        if (globalAddressHelper[myAddress] > 0){
            return globalAddressHelper[myAddress];
        }
        
        // legacy 
        // for (uint i = 0 ; i < globalAddressIndex.length ; i++ ){
        //     if (globalAddressIndex[i] == myAddress){
        //         return i;
        //     }
        // }

        return 0;
    }

    function _laddrGetAddr(uint laddrIx) private view returns (address myAddress){

        require(laddrIx > 0);

        require(globalAddressIndex.length > laddrIx);

        return globalAddressIndex[laddrIx]; 
    }

    function _hasLink(uint sIx, uint lIx) private view returns (bool link){
        

        for (uint i = 0 ; i < subjectIxTolinkedAddrIx[sIx].linkedAddressesIx.length ; i++ ){
            if (subjectIxTolinkedAddrIx[sIx].linkedAddressesIx[i] == lIx) {
                return true;
            }
        }

        return false;
    }

    function getSubjectCountByAddress(address linkedAddress) public view returns(uint subjectCount) {
        var subjects = getSubjectsByAddress(linkedAddress);

        return subjects.length;
    }

    function getSingleSubjectByAddress(address linkedAddress, uint subjectIndex) public view returns(address subject) {
        var subjects = getSubjectsByAddress(linkedAddress);

        return subjects[subjectIndex];
    }

    function getSubjectsByAddress(address linkedAddress) public view returns(address[] subjects) {
        uint lIx = _laddrGetIx(linkedAddress);
        // We dont want to throw here as customer might have installed a special handler 
        // if address is not registered 
        // require(lIx > 0);
        if (lIx == 0) {
            return new address[](0);
        }

        uint _arrLength = linkedAddrIxToSubjectIx[lIx].length;
        address[] memory _laddrs = new address[](_arrLength);

        for (uint i = 0 ; i < _arrLength ; i++ ){
            _laddrs[i] = _laddrGetAddr(linkedAddrIxToSubjectIx[lIx][i]);
        }

        return _laddrs;
    }

    function getLinkages(address subject) public view returns(address[] linkedAddresses) {
        uint sIx = _laddrGetIx(subject);

        require(sIx > 0);

        uint _arrLength = subjectIxTolinkedAddrIx[sIx].linkedAddressesIx.length;
        address[] memory _laddrs = new address[](_arrLength);

        for (uint i = 0 ; i < _arrLength ; i++ ){
            _laddrs[i] = _laddrGetAddr(subjectIxTolinkedAddrIx[sIx].linkedAddressesIx[i]);
        }

        return _laddrs;
    }

    function getLinkagesWithProofs(address subject) public view returns( address[] memory addrLinks, bytes32[] memory proofHashes ) {
        address[] memory _addrLinks = getLinkages(subject);

        uint _arrLength = _addrLinks.length;
        bytes32[] memory _proofHashes = new bytes32[](_arrLength);

        uint sIx = _laddrGetIx(subject);

        require(sIx > 0);

        for (uint i = 0 ; i < _arrLength ; i++ ){
            _proofHashes[i] = subjectIxTolinkedAddrIx[sIx].linkHashMaps[i];
        }

        return (_addrLinks , _proofHashes);
    }



    function submitLinkage(address linkedAddress, bytes32 txHash) public returns(uint linkageCount) {
        // var isSelf = (msg.sender == subject);

        // require(isSelf);
        address subject = msg.sender;

        // Taking hash value we could calculate the actual tx signer address
        // and check if it was signed by linkedAddress.
        // This in no way warranties that this transaction was sent to subject, 
        // so for now we are leaving this as is.

        // uint8 v, bytes32 r, bytes32 s
        // bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        // bytes32 prefixedHash = keccak256(prefix, txHash);
        // address signer = ecrecover(prefixedHash, v, r, s);

        // require(linkedAddress == signer);

        uint sIx = _laddrAddOrGetIx(subject);
        require(sIx > 0);

        uint lIx = _laddrAddOrGetIx(linkedAddress);
        require(lIx > 0);

        // has not been linked already 
        require(!_hasLink(sIx, lIx));

        linkageCount = _linkCountByIx(sIx);
        
        subjectIxTolinkedAddrIx[sIx].linkedAddressesIx.push(lIx);

        subjectIxTolinkedAddrIx[sIx].linkHashMaps[linkageCount] = txHash;

        linkedAddrIxToSubjectIx[lIx].push(sIx);

        linkageCount++;

        GotLinkage(subject, linkedAddress, txHash, linkageCount);     
    }

    function terminateLinkage(address linkedAddress) public returns(uint linkageCount) {
        address subject = msg.sender;

        uint sIx = _laddrGetIx(subject);
        require(sIx > 0);

        uint lIx = _laddrGetIx(linkedAddress);
        require(lIx > 0);

        // has been linked  
        require(_hasLink(sIx, lIx));
        
        linkageCount = _linkCountByIx(sIx);
        linkageCount--;

        uint i = 0; 
        uint j; 
        if(linkageCount > 0){
            uint[] memory newLinkIx = new uint[](linkageCount);
            uint delIndex = 0;
            bytes32 emptyVar;

            j = 0; 
            for ( i = 0 ; i <= linkageCount ; i++ ){
                if(subjectIxTolinkedAddrIx[sIx].linkedAddressesIx[i] == lIx){
                    delIndex = i;
                    continue;
                }
                newLinkIx[j] = subjectIxTolinkedAddrIx[sIx].linkedAddressesIx[i];
                j++;
            }

            subjectIxTolinkedAddrIx[sIx].linkHashMaps[delIndex] = emptyVar; 
            subjectIxTolinkedAddrIx[sIx].linkedAddressesIx = newLinkIx;
        }else{
            delete(subjectIxTolinkedAddrIx[sIx]); 
        }

        uint _arrLength = linkedAddrIxToSubjectIx[lIx].length; //most of the time this is 1
        _arrLength--;

        if(_arrLength == 0){
             delete(linkedAddrIxToSubjectIx[lIx]);
        }else{
            uint[] memory newSubjectIx = new uint[](_arrLength);

            j = 0; 
            for ( i = 0 ; i <= _arrLength ; i++ ){
                if(linkedAddrIxToSubjectIx[lIx][i] == sIx){
                    continue;
                }
                newSubjectIx[j] = linkedAddrIxToSubjectIx[lIx][i];
                j++;
            }
            
            linkedAddrIxToSubjectIx[lIx] = newSubjectIx;
        }
       

        TerminatedLinkage(subject, linkedAddress, linkageCount);
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


    function getSubjectTypeCount(address subject) public constant returns (uint) {
        return subjectTypeIndexes[subject].length;
    }

    function getSubjectTypeAttrCount(address subject, uint typeNameIx) public constant returns (uint) {
        return subjectTypeClaimIndexes[subject][typeNameIx].length;
    }

    function getSubjectTypeAt(address subject, uint ix) public constant returns (uint) {
        return subjectTypeIndexes[subject][ix];
    }

    function getSubjectTypeAttrAt(address subject, uint typeNameIx, uint ix) public constant returns (uint) {
        return subjectTypeClaimIndexes[subject][typeNameIx][ix];
    }

    function getSubjectClaimSetSize(address subject, uint typeNameIx, uint attrNameIx) public constant returns (uint) {
        return subjectToTypeToAttrToClaims[subject][typeNameIx][attrNameIx].urls.length;
    }

    function getSubjectClaimSetEntryAt(address subject, uint typeNameIx, uint attrNameIx, uint ix) public constant returns (address issuer, uint url)
    {
        issuer = subjectToTypeToAttrToClaims[subject][typeNameIx][attrNameIx].issuers[ix];
        url = subjectToTypeToAttrToClaims[subject][typeNameIx][attrNameIx].urls[ix];
    }

    function getKeyProofsAddress() public constant returns(address) {
        return _keyProofsAddr;
    }

    function doThrow() private pure {
        assert(false);
    }
 }