/**
 * Step 12: Final Verdict Engine
 * Resolves final verdict strictly based on official confirmation, fact-checks, and evidence agreement.
 * Verdicts supported: 'Verified True', 'Likely True', 'Needs Verification', 'Likely Fake', 'Verified False'
 */

/**
 * Resolves the final verdict
 * @param {Object} data - Metrics and source counts compiled by the engine
 * @returns {string} Verdict string
 */
const resolveVerdict = (data) => {
  const {
    trustScore = 50,
    officialConfirmCount = 0,
    contradictingCount = 0,
    supportingCount = 0,
    factCheckCount = 0,
    agreementPercent = 50,
    evidenceStrength = 50,
    evidenceCount = 0
  } = data;

  // Rule 5 & 8: Check for Insufficient Evidence / Inconclusive results -> Needs Verification
  // Must have at least two independent trusted sources to produce VERIFIED TRUE or VERIFIED FALSE.
  if (evidenceCount < 2) {
    return 'Needs Verification';
  }

  // Rule 4: Check for significant disagreement -> Needs Verification
  // Return Needs Verification if trusted sources disagree significantly
  const significantDisagreement = supportingCount > 0 && contradictingCount > 0 && (agreementPercent > 20 && agreementPercent < 80);
  if (significantDisagreement) {
    return 'Needs Verification';
  }

  // Rule 4: Verified False
  // Return ONLY if:
  // - Multiple independent trusted sources clearly contradict the claim.
  // - Fact-check organizations or official sources confirm it is false.
  const multipleTrustedContradict = contradictingCount >= 2 && agreementPercent <= 15;
  const factCheckOrOfficialDeny = (factCheckCount > 0 || officialConfirmCount > 0) && (agreementPercent < 30 || trustScore < 35);
  
  if (multipleTrustedContradict || factCheckOrOfficialDeny) {
    return 'Verified False';
  }

  // Rule 4: Verified True
  // Return ONLY if:
  // - Multiple independent trusted sources support the claim.
  // - No credible contradictory evidence exists.
  const multipleTrustedSupport = (supportingCount >= 2 || (evidenceCount >= 2 && agreementPercent >= 85)) && contradictingCount === 0;
  const officialConfirmation = officialConfirmCount > 0 && agreementPercent >= 90 && contradictingCount === 0;

  if (officialConfirmation || (multipleTrustedSupport && trustScore >= 75)) {
    return 'Verified True';
  }

  // Weak/Likely Verdicts (Factual indicators are present but don't meet strict verification thresholds)
  if (agreementPercent >= 75) {
    return 'Likely True';
  }

  if (agreementPercent <= 35) {
    return 'Likely Fake';
  }

  // Default fallback if we can't resolve with certainty
  return 'Needs Verification';
};

module.exports = {
  resolveVerdict
};
