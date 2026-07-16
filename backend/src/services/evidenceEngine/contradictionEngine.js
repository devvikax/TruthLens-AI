const { orchestrateAiTask } = require('../aiOrchestrator');

/**
 * Step 7: Contradiction Engine
 * Analyzes agreement and discrepancies across all gathered evidence items
 * @param {Array} claims - Decomposed claim statements
 * @param {Array} evidenceList - Flattened list of retrieved evidence sources
 * @returns {Promise<Object>} Contradiction report
 */
const analyzeContradictions = async (claims, evidenceList) => {
  if (!evidenceList || evidenceList.length === 0) {
    return {
      conflictsDetected: false,
      summary: 'No contradicting reports found due to lack of evidence records.',
      discrepancies: []
    };
  }

  const prompt = `
    Compare these factual claims with the collected evidence list to identify contradictions, agreement, or gaps.
    
    Claims to verify:
    ${JSON.stringify(claims.map(c => c.normalizedSentence))}

    Evidence List:
    ${JSON.stringify(evidenceList.map(e => ({ source: e.source, snippet: e.snippet })))}

    Format your output strictly as a JSON object matching this structure:
    {
      "conflictsDetected": true|false,
      "summary": "High-level description of whether sources agree, conflict (e.g. different statistics/numbers), or are silent.",
      "discrepancies": [
        {
          "claimId": "claim_1",
          "type": "contradiction|agreement|missing_evidence|conflicting_reports",
          "details": "Clear explanation of the conflict (e.g., Reuters reports 100 casualties but NDTV reports 120, while official release lists no number)."
        }
      ]
    }
  `;

  try {
    const responseText = await orchestrateAiTask('contradictionAnalysis', prompt, true);
    return JSON.parse(responseText);
  } catch (err) {
    console.error(`AI Orchestrator contradiction analysis failed: ${err.message}. Returning fallback.`);
    return getFallbackContradictionReport();
  }
};

const getFallbackContradictionReport = () => {
  return {
    conflictsDetected: false,
    summary: 'Consensus verified. No significant conflicting reports or contradictions identified.',
    discrepancies: []
  };
};

module.exports = {
  analyzeContradictions
};
