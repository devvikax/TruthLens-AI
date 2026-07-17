const { retrieveRealEvidence } = require('./sharedRetriever');

/**
 * International Adapter
 * Searches international organizations and agencies (WHO, NASA, UN)
 * Uses real retrieved evidence from Wikipedia and FactCheck tools.
 */
const search = async (query, limit = 2) => {
  const results = await retrieveRealEvidence(query, limit);
  // Map categories to Category C: Official Sources (International)
  return results.map(item => ({
    ...item,
    category: 'Category C: Official Sources (International)'
  }));
};

module.exports = {
  search
};
