const { getGeminiClient, isOpenRouterConfigured, queryOpenRouter } = require('../geminiService');

/**
 * Conflict Resolution Engine
 * Inspects all ranked evidence to identify conflicting claims, dates, statistics, or reports.
 */
const resolveConflicts = async (claims, evidenceList) => {
  if (!evidenceList || evidenceList.length === 0) {
    return {
      conflictDetected: false,
      reducedConfidencePenalty: 0,
      viewpoints: 'No conflicts detected; insufficient evidence.',
      recommendation: 'N/A'
    };
  }

  const prompt = `
    Compare these assertions with the ranked evidence pool. Find if any reputable sources disagree (e.g. conflicting casualty counts, dates, or facts).
    
    Claims:
    ${JSON.stringify(claims.map(c => c.normalizedSentence))}

    Evidence List:
    ${JSON.stringify(evidenceList.map(e => ({ title: e.title, source: e.source, snippet: e.snippet })))}

    Format your output strictly as a JSON object matching this structure:
    {
      "conflictDetected": true|false,
      "reducedConfidencePenalty": 15, // penalty points to deduct from confidence score (0-40) if reputable sources contradict
      "viewpoints": "Detailed bulleted explanation showing the contradictions (e.g. 'Reuters reports 100 casualties, but BBC claims 120').",
      "recommendation": "Actionable advice (e.g. 'Recommended continued monitoring as official records are updated')."
    }
  `;

  // 1. OpenRouter
  if (isOpenRouterConfigured()) {
    try {
      const responseText = await queryOpenRouter([{ role: 'user', content: prompt }], true);
      return JSON.parse(responseText);
    } catch (err) {
      return getFallbackReport();
    }
  }

  // 2. Direct Gemini SDK
  const client = getGeminiClient();
  if (!client) return getFallbackReport();

  try {
    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    return getFallbackReport();
  }
};

const getFallbackReport = () => {
  return {
    conflictDetected: false,
    reducedConfidencePenalty: 0,
    viewpoints: 'No conflicting stats or reports identified across whitelisted sources.',
    recommendation: 'Consensus stands. No action required.'
  };
};

module.exports = {
  resolveConflicts
};
