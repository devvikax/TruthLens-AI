const { searchFactChecks } = require('../../searchService');

/**
 * Fact Check Adapter
 * Cross-references claims against verified global factcheck registries
 */
const search = async (query, limit = 2) => {
  try {
    const results = await searchFactChecks(query);
    if (!results || results.length === 0) {
      return [];
    }

    // Map into consistent adapter format
    return results.slice(0, limit).map((fc, idx) => ({
      title: `Fact-Check: ${fc.claim}`,
      snippet: `Official Verdict: [${fc.verdict}] reported by ${fc.checkedBy}.`,
      url: fc.url || 'https://factchecktools.googleapis.com',
      source: fc.checkedBy || 'Google Fact Check Tools',
      category: 'Category D: Fact Check Organizations',
      date: new Date().toISOString().split('T')[0] // default freshness
    }));
  } catch (err) {
    console.error(`Fact Check Adapter lookup failed: ${err.message}`);
    return [];
  }
};

module.exports = {
  search
};
