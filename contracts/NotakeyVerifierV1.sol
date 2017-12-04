pragma solidity ^0.4.15;

import './ClaimRegistry.sol';

contract NotakeyVerifierV1 {

    uint public constant ICO_CONTRIBUTOR_TYPE = 6;
    uint public constant REPORT_BUNDLE = 6;
    uint public constant NATIONALITY_INDEX = 7;

    address public claimRegistryAddr;
    address public trustedIssuerAddr;

    uint public constant USA = 883423532389192164791648750371459257913741948437809479060803100646309888;                
        // USA is 240nd; blacklist: 1 << (240-1)
    uint public constant CHINA = 8796093022208;
        // China is 44th; blacklist: 1 << (44-1)
    uint public constant SOUTH_KOREA = 83076749736557242056487941267521536;
        // SK is 117th; blacklist: 1 << (117-1)
    
    function NotakeyVerifierV1(address _trustedIssuerAddr, address _claimRegistryAddr) public {
        claimRegistryAddr = _claimRegistryAddr;
        trustedIssuerAddr  = _trustedIssuerAddr;
    }

    modifier onlyVerifiedSenders(address subject, uint256 nationalityBlacklist) {
        require(_hasIcoContributorType(subject));
        require(!_preventedByNationalityBlacklist(subject, nationalityBlacklist));

        _;
    }

    function isVerified(address subject, uint256 nationalityBlacklist) public constant onlyVerifiedSenders(subject, nationalityBlacklist) returns (bool) {
        return true;
    }

    function _preventedByNationalityBlacklist(address subject, uint256 nationalityBlacklist) internal constant returns (bool)
    {
        var claimRegistry = ClaimRegistry(claimRegistryAddr);
        var claimCount = claimRegistry.getSubjectClaimSetSize(subject, ICO_CONTRIBUTOR_TYPE, NATIONALITY_INDEX);
        uint256 ignoredClaims = 0;

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

        return false;
    }   

    function _hasIcoContributorType(address subject) constant returns (bool)
    {
        var atLeastOneValidReport = false;
        var atLeastOneValidNationality = false;
        
        var claimRegistry = ClaimRegistry(claimRegistryAddr);
        
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

        return atLeastOneValidNationality && atLeastOneValidReport;
    }   
}