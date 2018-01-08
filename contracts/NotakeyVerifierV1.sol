pragma solidity ^0.4.15;

import './ClaimRegistry.sol';

contract NotakeyVerifierV1 {

    uint public constant ICO_CONTRIBUTOR_TYPE = 6;
    uint public constant REPORT_BUNDLE = 6;
    uint public constant NATIONALITY_INDEX = 7;

    address public claimRegistryAddr;
    address public trustedIssuerAddr;
    // address private callerIdentitySubject;

    uint public constant USA = 883423532389192164791648750371459257913741948437809479060803100646309888;                
        // USA is 240nd; blacklist: 1 << (240-1)
    uint public constant CHINA = 8796093022208;
        // China is 44th; blacklist: 1 << (44-1)
    uint public constant SOUTH_KOREA = 83076749736557242056487941267521536;
        // SK is 117th; blacklist: 1 << (117-1)
    
     event GotUnregisteredPaymentAddress(address indexed paymentAddress);


    function NotakeyVerifierV1(address _trustedIssuerAddr, address _claimRegistryAddr) public {
        claimRegistryAddr = _claimRegistryAddr;
        trustedIssuerAddr  = _trustedIssuerAddr;
    }

    modifier onlyVerifiedSenders(address paymentAddress, uint256 nationalityBlacklist) {
        require(_hasIcoContributorType(paymentAddress));
        require(!_preventedByNationalityBlacklist(paymentAddress, nationalityBlacklist));

        _;
    }
    
    function isVerified(address subject, uint256 nationalityBlacklist) public constant onlyVerifiedSenders(subject, nationalityBlacklist) returns (bool) {
        return true;
    }

    function _preventedByNationalityBlacklist(address paymentAddress, uint256 nationalityBlacklist) internal constant returns (bool)
    {
        var claimRegistry = ClaimRegistry(claimRegistryAddr);

        uint subjectCount = _lookupOwnerIdentityCount(paymentAddress);

        uint256 ignoredClaims;
        uint claimCount;
        address subject;
        
        // Loop over all isued identities associated to this wallet adress and 
        // throw if any match to blacklist 
        for (uint subjectIndex = 0 ; subjectIndex < subjectCount ; subjectIndex++ ){
            subject = claimRegistry.getSingleSubjectByAddress(paymentAddress, subjectIndex);
            claimCount = claimRegistry.getSubjectClaimSetSize(subject, ICO_CONTRIBUTOR_TYPE, NATIONALITY_INDEX);
            ignoredClaims = 0;

            for (uint i = 0; i < claimCount; ++i) {
                var (issuer, url) = claimRegistry.getSubjectClaimSetEntryAt(subject, ICO_CONTRIBUTOR_TYPE, NATIONALITY_INDEX, i);
                var countryMask = 2**(url-1);

                if (issuer != trustedIssuerAddr) {
                    ignoredClaims += 1;
                } else {
                    if (((countryMask ^ nationalityBlacklist) & countryMask) != countryMask) {
                        return true;
                    } 
                }
            }

            // If the blacklist is empty (0), then that's fine; but if there is a blacklist,
            // we must ensure there are nationalityIndex attributes to verify against
            //
            // Account for ignored claims (issued by unrecognized issuers)
            require(nationalityBlacklist == 0 || (claimCount - ignoredClaims) > 0);
        }

        

        return false;
    }   

    function _lookupOwnerIdentityCount(address paymentAddress) internal constant returns (uint){
        var claimRegistry = ClaimRegistry(claimRegistryAddr);
        var subjectCount = claimRegistry.getSubjectCountByAddress(paymentAddress);
        
        // The address is unregistered so we throw and log event
        // This method and callers have to overriden as non-constant to emit events 
        // if ( subjectCount == 0 ) {
            // GotUnregisteredPaymentAddress( paymentAddress );
            // revert();
        // }

        require(subjectCount > 0);

        return subjectCount;
    }

    function _hasIcoContributorType(address paymentAddress) internal constant returns (bool)
    {
        uint subjectCount = _lookupOwnerIdentityCount(paymentAddress);

        var atLeastOneValidReport = false;
        var atLeastOneValidNationality = false;
        address subject;

        var claimRegistry = ClaimRegistry(claimRegistryAddr);
        
        // Loop over all isued identities associated to this wallet address and 
        // exit loop any satisfy the business logic requirement  
        for (uint subjectIndex = 0 ; subjectIndex < subjectCount ; subjectIndex++ ){
            subject = claimRegistry.getSingleSubjectByAddress(paymentAddress, subjectIndex);

            var nationalityCount = claimRegistry.getSubjectClaimSetSize(subject, ICO_CONTRIBUTOR_TYPE, NATIONALITY_INDEX);
            for (uint nationalityIndex = 0; nationalityIndex < nationalityCount; ++nationalityIndex) {
                var (nationalityIssuer,) = claimRegistry.getSubjectClaimSetEntryAt(subject, ICO_CONTRIBUTOR_TYPE, NATIONALITY_INDEX, nationalityIndex);
                if (nationalityIssuer == trustedIssuerAddr) {
                    atLeastOneValidNationality = true;
                    break;
                }
            }

            var reportCount = claimRegistry.getSubjectClaimSetSize(subject, ICO_CONTRIBUTOR_TYPE, REPORT_BUNDLE);
            for (uint reportIndex = 0; reportIndex < reportCount; ++reportIndex) {
                var (reportIssuer,) = claimRegistry.getSubjectClaimSetEntryAt(subject, ICO_CONTRIBUTOR_TYPE, REPORT_BUNDLE, reportIndex);
                if (reportIssuer == trustedIssuerAddr) {
                    atLeastOneValidReport = true;
                    break;
                }
            }
        }

        return atLeastOneValidNationality && atLeastOneValidReport;
    }   
}