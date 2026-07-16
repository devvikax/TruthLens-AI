/**
 * Cross-references text claims against Google Fact Check Tools API
 * @param {string} query - Keyword queries built from claim or entity extraction
 * @returns {Promise<Array<{claim: string, verdict: string, checkedBy: string, url: string}>>} List of verified matches
 */
const searchFactChecks = async (query) => {
  try {
    const apiKey = process.env.FACTCHECK_API_KEY;
    if (!apiKey || apiKey === 'your_google_factcheck_api_key_here') {
      console.log('FactCheck Tools API Key not configured. Returning empty matching lists.');
      return [];
    }

    // Build URL parameters (ensure query is URI encoded)
    const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(query)}&key=${apiKey}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      console.warn(`Fact Check Tools API returned status: ${response.status}. Falling back to empty results.`);
      return [];
    }

    const data = await response.json();
    if (!data.claims || data.claims.length === 0) {
      return [];
    }

    // Parse up to 3 highest relevance matching claims
    const matches = data.claims.slice(0, 3).map((c) => {
      const review = c.claimReview && c.claimReview[0] ? c.claimReview[0] : {};
      return {
        claim: c.text || 'Unlisted Claim',
        verdict: review.textualRating || 'Unrated',
        checkedBy: review.publisher ? review.publisher.name : 'Unknown Fact-Checker',
        url: review.url || ''
      };
    });

    return matches;
  } catch (error) {
    console.error(`Search Service Error: ${error.message}`);
    // Return empty array instead of failing the pipeline
    return [];
  }
};

module.exports = { searchFactChecks };
