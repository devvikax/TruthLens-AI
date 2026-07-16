const { orchestrateAiTask } = require('../aiOrchestrator');

/**
 * Step 9: Evidence Consensus Engine
 * Builds consensus metrics for every individual claim against the retrieved evidence list
 * @param {Array} claims - Decomposed claims list
 * @param {Array} evidenceList - Flattened list of retrieved evidence sources
 * @returns {Promise<Array>} List of claim objects augmented with consensus scores
 */
const calculateConsensus = async (claims, evidenceList) => {
  if (!evidenceList || evidenceList.length === 0) {
    return claims.map(c => ({
      ...c,
      supportingCount: 0,
      contradictingCount: 0,
      independentCount: 0,
      officialCount: 0,
      evidenceStrength: 0,
      agreementPercent: 0,
      status: 'unverified'
    }));
  }

  const prompt = `
    Analyze how each factual claim matches the collected evidence.
    
    Claims:
    ${JSON.stringify(claims)}

    Evidence List:
    ${JSON.stringify(evidenceList.map(e => ({ title: e.title, source: e.source, snippet: e.snippet, url: e.url })))}

    For every claim in the array, calculate:
    - supportingCount (number of sources that corroborate this claim)
    - contradictingCount (number of sources that contradict this claim)
    - independentCount (number of general media / independent sources referencing this claim)
    - officialCount (number of official government, WHO, NASA, or ISRO sources confirming this claim)
    - evidenceStrength (0-100 rating indicating overall solidity of gathered proof)
    - agreementPercent (percentage of sources that agree with this claim vs contradict it)

    Respond strictly with a JSON array matching the original claims array length, where each claim object has these added properties. Do not include any other markdown text.
  `;

  try {
    const responseText = await orchestrateAiTask('consensusEvaluation', prompt, true);
    return JSON.parse(responseText);
  } catch (err) {
    console.error(`AI Orchestrator consensus calculation failed: ${err.message}. Returning fallbacks.`);
    return getFallbackConsensus(claims, evidenceList);
  }
};

const getFallbackConsensus = (claims, evidenceList = []) => {
  const debunkKeywords = [
    'fake', 'false', 'debunk', 'misleading', 'hoax', 'rumor', 'untrue', 'fabricated',
    'no evidence', 'never qualified', 'झूठ', 'अफवाह', 'गलत', 'फर्जी'
  ];
  
  const hasDebunk = evidenceList.some(e => {
    if (e.stance === 'contradicts') return true;
    const text = ((e.title || '') + ' ' + (e.snippet || '')).toLowerCase();
    return debunkKeywords.some(kw => text.includes(kw));
  });

  const contradictingCount = evidenceList.filter(e => e.stance === 'contradicts').length || (hasDebunk ? 1 : 0);
  const supportingCount = evidenceList.filter(e => e.stance === 'supports').length || (hasDebunk ? 0 : (evidenceList.length > 0 ? 1 : 0));

  return claims.map(c => {
    if (contradictingCount > 0) {
      return {
        ...c,
        supportingCount,
        contradictingCount,
        independentCount: 1,
        officialCount: 0,
        evidenceStrength: 80,
        agreementPercent: Math.round((supportingCount / (supportingCount + contradictingCount || 1)) * 100) || 10,
        status: 'contradicted'
      };
    }
    
    const hasEvidence = evidenceList.length > 0;
    return {
      ...c,
      supportingCount: hasEvidence ? 1 : 0,
      contradictingCount: 0,
      independentCount: hasEvidence ? 1 : 0,
      officialCount: 0,
      evidenceStrength: hasEvidence ? 60 : 30,
      agreementPercent: hasEvidence ? 70 : 50,
      status: 'unverified'
    };
  });
};

module.exports = {
  calculateConsensus
};
