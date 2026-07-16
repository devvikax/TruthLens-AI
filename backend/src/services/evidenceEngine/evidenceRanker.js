const { getDomainName } = require('./sourceRegistryService');

const DEFAULT_RANKING_WEIGHTS = {
  sourceReliability: 0.40,
  claimRelevance: 0.30,
  freshness: 0.20,
  originalReporting: 0.10
};

/**
 * Heuristic text relevance score (0-100) based on query term intersections
 */
const calculateRelevanceScore = (text = '', query = '') => {
  const cleanText = text.toLowerCase();
  const cleanQuery = query.toLowerCase();

  const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 3);
  if (queryWords.length === 0) return 50;

  let matchCount = 0;
  queryWords.forEach(word => {
    if (cleanText.includes(word)) {
      matchCount++;
    }
  });

  return Math.round((matchCount / queryWords.length) * 100);
};

/**
 * Heuristic freshness score (0-100) based on publication date age
 */
const calculateFreshnessScore = (pubDateStr = '') => {
  if (!pubDateStr) return 50; // default baseline

  try {
    const pubDate = new Date(pubDateStr);
    const now = new Date();
    const ageInDays = (now - pubDate) / (1000 * 60 * 60 * 24);

    if (ageInDays <= 2) return 100;
    if (ageInDays <= 7) return 90;
    if (ageInDays <= 30) return 75;
    if (ageInDays <= 365) return 50;
    
    return 20; // older than a year
  } catch (err) {
    return 50;
  }
};

/**
 * Filter and rank evidence pool for a given claim query
 * @param {Array} evidencePool - Discovered evidence references
 * @param {string} query - Normalized claim query
 * @param {Object} weights - Configuration weights override
 * @returns {Array} Filtered and sorted evidence array
 */
const rankEvidence = (evidencePool = [], query = '', weights = DEFAULT_RANKING_WEIGHTS) => {
  const rated = evidencePool.map(item => {
    const relevance = calculateRelevanceScore(item.snippet + ' ' + item.title, query);
    const freshness = calculateFreshnessScore(item.date);
    
    const reliability = item.reliabilityScore || 50;
    const isOriginal = item.primarySource && item.primarySource.isOriginal ? 100 : 40;

    // Weighted Score (0-100)
    const score = Math.round(
      reliability * weights.sourceReliability +
      relevance * weights.claimRelevance +
      freshness * weights.freshness +
      isOriginal * weights.originalReporting
    );

    return {
      ...item,
      relevanceScore: relevance,
      freshnessScore: freshness,
      rankingScore: score
    };
  });

  // Relevance filter: discard weakly related evidence (score < 25)
  const filtered = rated.filter(item => item.relevanceScore >= 20);

  // Sort descending by ranking score
  return filtered.sort((a, b) => b.rankingScore - a.rankingScore);
};

module.exports = {
  rankEvidence,
  calculateRelevanceScore,
  calculateFreshnessScore
};
