const { orchestrateAiTask } = require('../aiOrchestrator');

/**
 * Step 2: Claim Decomposition Engine
 * Decomposes articles/texts into standalone factual assertions
 * @param {string} text - Cleaned input corpus
 * @returns {Promise<Array>} List of decomposed claims
 */
const decomposeClaims = async (text) => {
  const prompt = `
    You are an expert fact-checking analyzer. Decompose the following text into distinct, factual assertions (claims) that can be verified independently.
    Do NOT include opinions, greetings, or formatting text.
    
    Text:
    "${text}"

    Respond strictly with a JSON array of objects following this format:
    [
      {
        "id": "claim_1",
        "originalSentence": "The exact sentence or fragment from the text representing the claim.",
        "normalizedSentence": "A normalized, self-contained statement of the claim (e.g., resolving pronouns like 'it' or 'he' to the actual nouns).",
        "priority": "high|medium|low",
        "confidence": 0.95 // numeric confidence rating between 0 and 1
      }
    ]
  `;

  try {
    const responseText = await orchestrateAiTask('claimDecomposition', prompt, true);
    return JSON.parse(responseText);
  } catch (err) {
    console.error(`AI Orchestrator claim decomposition failed: ${err.message}. Falling back to default list.`);
    return getFallbackClaims(text);
  }
};

const getFallbackClaims = (text) => {
  // Simple heuristic sentence split fallback
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 15);
  return sentences.map((s, idx) => ({
    id: `claim_${idx + 1}`,
    originalSentence: s,
    normalizedSentence: s,
    priority: idx === 0 ? 'high' : 'medium',
    confidence: 0.85
  }));
};

module.exports = {
  decomposeClaims
};
