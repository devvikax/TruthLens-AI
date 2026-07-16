/**
 * Step 12: Final Verdict Engine
 * Resolves final verdict strictly based on official confirmation, fact-checks, and evidence agreement.
 * Verdicts supported: 'Verified True', 'Likely True', 'Unverified', 'Likely Fake', 'Verified Fake'
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
    evidenceStrength = 50
  } = data;

  // 1. Rule: Verified Fake
  const hasOfficialDenial = officialConfirmCount > 0 && contradictingCount > 0;
  const multipleFactCheckDebunks = factCheckCount >= 2 && trustScore < 50;
  const strongContradictoryEvidence = agreementPercent < 20 && evidenceStrength >= 80;

  if (hasOfficialDenial || multipleFactCheckDebunks || strongContradictoryEvidence || trustScore < 30) {
    if (hasOfficialDenial || multipleFactCheckDebunks) {
      return 'Verified Fake';
    }
    return 'Likely Fake';
  }

  // 2. Rule: Verified True
  const hasOfficialConfirmation = officialConfirmCount > 0 && agreementPercent >= 90;
  const strongIndependentEvidence = agreementPercent >= 90 && evidenceStrength >= 80 && supportingCount >= 3;

  if (hasOfficialConfirmation || strongIndependentEvidence || trustScore >= 75) {
    if (hasOfficialConfirmation || (strongIndependentEvidence && trustScore >= 85)) {
      return 'Verified True';
    }
    return 'Likely True';
  }

  // 3. Fallback: Unverified
  return 'Unverified';
};

module.exports = {
  resolveVerdict
};
