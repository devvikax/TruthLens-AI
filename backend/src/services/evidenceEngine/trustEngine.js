/**
 * Step 11: Trust Score Engine
 * Computes a weighted credibility rating (0-100) using category-specific weights.
 */

const DEFAULT_WEIGHTS = {
  evidenceQuality: 0.30,      // Fact-check match & evidence strength
  sourceReliability: 0.20,    // Domain signals, publisher reputation
  independentSources: 0.15,   // Count of independent news coverages
  officialConfirmation: 0.15, // Officially confirmed status (e.g. PIB, WHO, ISRO)
  agreementConsensus: 0.10,   // Percentage of source agreement vs conflict
  manipulationControl: 0.10   // Absence of sensationalism, fear triggers
};

/**
 * Returns dynamic weights optimized for the claim category
 * @param {string} claimType - Primary claim category
 * @returns {Object} Optimised weights mapping
 */
const getCategoryOptimizedWeights = (claimType = '') => {
  const t = claimType.trim();
  
  if (t === 'Health / Medical') {
    // Medical claims place premium weight on official confirmations (WHO/CDC) and peer review,
    // and lower weight on general independent source volume to avoid viral blog bias
    return {
      evidenceQuality: 0.25,
      sourceReliability: 0.25,
      independentSources: 0.05,
      officialConfirmation: 0.30, // Elevated WHO/CDC status weight
      agreementConsensus: 0.10,
      manipulationControl: 0.05
    };
  }
  
  if (t === 'Government Announcement' || t === 'Election / Politics') {
    // Government updates rely heavily on official portal confirmations (PIB, EC)
    return {
      evidenceQuality: 0.20,
      sourceReliability: 0.20,
      independentSources: 0.10,
      officialConfirmation: 0.35, // Elevated government/Gazette confirmation weight
      agreementConsensus: 0.10,
      manipulationControl: 0.05
    };
  }

  if (t === 'Death / Celebrity Death') {
    // Celebrity death reports must prioritize source consensus and official declarations
    return {
      evidenceQuality: 0.20,
      sourceReliability: 0.25,
      independentSources: 0.15,
      officialConfirmation: 0.20,
      agreementConsensus: 0.15, // Consensus is crucial to detect early hoaxes
      manipulationControl: 0.05
    };
  }

  if (t === 'Space' || t === 'Science') {
    // Science claims place maximum weight on official agencies (NASA, ISRO) and journals
    return {
      evidenceQuality: 0.25,
      sourceReliability: 0.25,
      independentSources: 0.05,
      officialConfirmation: 0.30, // NASA/ISRO confirmations
      agreementConsensus: 0.10,
      manipulationControl: 0.05
    };
  }

  if (t === 'Financial Scam' || t === 'Investment') {
    // Scams require official regulatory check confirmation and low sensationalism flags
    return {
      evidenceQuality: 0.25,
      sourceReliability: 0.20,
      independentSources: 0.10,
      officialConfirmation: 0.25, // RBI/SEBI warnings
      agreementConsensus: 0.10,
      manipulationControl: 0.10
    };
  }

  return DEFAULT_WEIGHTS;
};

/**
 * Calculates a weighted trust score
 * @param {Object} metrics - Calculated pipeline metrics
 * @param {string} claimType - Primary category of the claim
 * @returns {number} Trust Score (0-100)
 */
const calculateWeightedTrustScore = (metrics, claimType = '') => {
  const weights = getCategoryOptimizedWeights(claimType);

  // If there are no sources at all, return 50 (neutral/baseline)
  if (metrics.evidenceQuality === 0 && metrics.sourceReliability === 0) {
    return 50;
  }

  const eq = metrics.evidenceQuality !== undefined ? metrics.evidenceQuality : 50;
  const sr = metrics.sourceReliability !== undefined ? metrics.sourceReliability : 50;
  
  // Calculate independent source score and official confirmations dynamically
  const ind = metrics.independentSources !== undefined ? metrics.independentSources : 50;
  const off = metrics.officialConfirmation !== undefined ? metrics.officialConfirmation : 40;
  const ac = metrics.agreementConsensus !== undefined ? metrics.agreementConsensus : 50;
  const mc = metrics.manipulationControl !== undefined ? metrics.manipulationControl : 80;

  let trustScore = Math.round(
    eq * weights.evidenceQuality +
    sr * weights.sourceReliability +
    ind * weights.independentSources +
    off * weights.officialConfirmation +
    ac * weights.agreementConsensus +
    mc * weights.manipulationControl
  );

  // Boost trust score if consensus is high and there are no contradictions
  if (ac >= 80 && (!metrics.contradictingCount || metrics.contradictingCount === 0)) {
    // If we have verified trusted media sources, give it a high score
    if (sr >= 75) {
      trustScore = Math.max(trustScore, 85);
    }
  }

  // Penalize trust score if contradiction is high or agreement is very low
  if (ac <= 20 || (metrics.contradictingCount >= 2 && ac < 30)) {
    trustScore = Math.min(trustScore, 25);
  }

  return Math.max(0, Math.min(100, trustScore));
};

module.exports = {
  calculateWeightedTrustScore,
  getCategoryOptimizedWeights,
  DEFAULT_WEIGHTS
};
