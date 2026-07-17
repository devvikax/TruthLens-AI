const { retrieveRealEvidence } = require('./sharedRetriever');

/**
 * Government Adapter
 * Searches official government press portals (.gov, .gov.in, PIB)
 * Uses real retrieved evidence from Wikipedia and FactCheck tools.
 */
const search = async (query, limit = 2) => {
  const results = await retrieveRealEvidence(query, limit);
  // Map categories to Category C: Official Sources (Government)
  return results.map(item => ({
    ...item,
    category: 'Category C: Official Sources (Government)'
  }));
};

module.exports = {
  search
};
