const { retrieveRealEvidence } = require('./sharedRetriever');

/**
 * Web Search Adapter
 * Queries Wikipedia and fact-check tools for general knowledge references.
 * Under no circumstances does it generate simulated/hallucinated crawler data.
 */
const search = async (query, limit = 2) => {
  const results = await retrieveRealEvidence(query, limit);
  // Map categories to Category F: Live Web Search
  return results.map(item => ({
    ...item,
    category: 'Category F: Live Web Search'
  }));
};

module.exports = {
  search
};
