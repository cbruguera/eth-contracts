pragma solidity ^0.4.15;

import './NotakeyVerifierV1.sol';

contract TestVerifier is NotakeyVerifierV1 {

    function TestVerifier(address trustedIssuer, address _claimRegistry) NotakeyVerifierV1(trustedIssuer, _claimRegistry) public {
        
    }

    function vipFunction(uint nationBlacklist) onlyVerifiedSenders(msg.sender, nationBlacklist) public view {
        
    }

    function test_preventedByNationalityBlacklist(address subject, uint256 nationalityBlacklist) public constant returns (bool)
    {
        return super._preventedByNationalityBlacklist(subject, nationalityBlacklist);
    }

    function test_hasIcoContributorType(address subject) public constant returns (bool)
    {
        return super._hasIcoContributorType(subject);
    }

}
