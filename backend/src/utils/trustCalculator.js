/**
 * Calculates a weighted Trust Score and resolves the semantic verdict
 * @param {Object} metrics - Component scores (0-100)
 * @param {number} metrics.sourceReputation
 * @param {number} metrics.biasScore
 * @param {number} metrics.claimVerification
 * @param {number} metrics.emotionScore
 * @param {Object} [customWeights] - Custom weight variables summing to 1.0
 * @returns {{trustScore: number, verdict: string, weightsUsed: Object}} Consolidated results
 */
const calculateTrustScore = (metrics, customWeights = {}) => {
  // Default configurable weights
  const defaultWeights = {
    sourceReputation: 0.25,
    biasScore: 0.20,
    claimVerification: 0.45,
    emotionScore: 0.10
  };

  // Merge default weights with custom options
  const weights = { ...defaultWeights, ...customWeights };

  // Normalize weights to sum up to exactly 1.0 in case of custom deviations
  const sumWeights = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const normalizedWeights = {};
  for (const [key, value] of Object.entries(weights)) {
    normalizedWeights[key] = sumWeights > 0 ? value / sumWeights : defaultWeights[key];
  }

  // Calculate weighted sum
  let weightedScore = 0;
  weightedScore += (metrics.sourceReputation || 50) * normalizedWeights.sourceReputation;
  weightedScore += (metrics.biasScore || 50) * normalizedWeights.biasScore;
  weightedScore += (metrics.claimVerification || 50) * normalizedWeights.claimVerification;
  weightedScore += (metrics.emotionScore || 50) * normalizedWeights.emotionScore;

  // Round overall score to nearest integer
  const trustScore = Math.min(Math.max(Math.round(weightedScore), 0), 100);

  // Map overall score ranges to verdicts
  let verdict = '🟡 Needs Verification';
  if (trustScore >= 75) {
    verdict = '🟢 Likely Genuine';
  } else if (trustScore < 40) {
    verdict = '🔴 Likely Misleading';
  }

  return {
    trustScore,
    verdict,
    weightsUsed: normalizedWeights
  };
};

module.exports = { calculateTrustScore };
