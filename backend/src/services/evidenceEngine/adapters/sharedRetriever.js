const { searchFactChecks } = require('../../searchService');
const { searchWeb } = require('./webSearcher');

/**
 * Searches real sources: queries Google Fact Check, Wikipedia, and DuckDuckGo.
 * Under no circumstances does it generate/fabricate mock results.
 */
const retrieveRealEvidence = async (query, limit = 3) => {
  const webResults = await searchWeb(query, limit);
  
  let factCheckResults = [];
  try {
    const fcData = await searchFactChecks(query);
    if (fcData && fcData.length > 0) {
      factCheckResults = fcData.slice(0, limit).map(fc => ({
        title: `Fact-Check: ${fc.claim}`,
        snippet: `Official Verdict: [${fc.verdict}] reported by ${fc.checkedBy}.`,
        url: fc.url || 'https://factchecktools.googleapis.com',
        source: fc.checkedBy || 'Google Fact Check Tools',
        category: 'Category D: Fact Check Organizations',
        date: new Date().toISOString().split('T')[0]
      }));
    }
  } catch (err) {
    console.error(`Fact check lookup failed for [${query}]: ${err.message}`);
  }

  // Combine both sources
  return [...factCheckResults, ...webResults];
};

module.exports = {
  retrieveRealEvidence
};
