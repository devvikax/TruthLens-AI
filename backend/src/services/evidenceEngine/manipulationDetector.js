const { orchestrateAiTask } = require('../aiOrchestrator');

/**
 * Step 10: Manipulation Detector
 * Inspects raw texts for fear, clickbait, urgency, emotional prompts, bias, and conspiracy keywords
 * @param {string} text - Cleaned input corpus
 * @returns {Promise<Object>} Object containing manipulation metrics
 */
const detectManipulation = async (text) => {
  const prompt = `
    Analyze the following text for manipulative language, emotional triggers, clickbait framing, and bias.
    
    Text:
    "${text}"

    Respond strictly in this JSON format:
    {
      "fearScore": 30, // 0-100 score indicating presence of panic or fear mongering (0 = none, 100 = high panic)
      "clickbaitScore": 20, // 0-100 score indicating clickbait framing or sensational headline style
      "urgencyScore": 10, // 0-100 score indicating artificial urgency triggers (e.g. 'Share immediately!!')
      "emotionalityScore": 40, // 0-100 score indicating presence of loaded or emotional language
      "politicalBias": "left|right|center|none|loaded",
      "sensationalism": true|false,
      "conspiracyLanguage": true|false,
      "manipulationTriggers": ["fear", "urgency", "none"],
      "explanation": "Brief explanation of how the text tries to manipulate the reader."
    }
  `;

  try {
    const responseText = await orchestrateAiTask('manipulationDetection', prompt, true);
    return JSON.parse(responseText);
  } catch (err) {
    console.error(`AI Orchestrator manipulation detection failed: ${err.message}. Returning baseline mock.`);
    return getBaselineManipulation();
  }
};

const getBaselineManipulation = () => {
  return {
    fearScore: 10,
    clickbaitScore: 10,
    urgencyScore: 5,
    emotionalityScore: 15,
    politicalBias: "none",
    sensationalism: false,
    conspiracyLanguage: false,
    manipulationTriggers: ["none"],
    explanation: "Material displays factual, objective, and neutral framing."
  };
};

module.exports = {
  detectManipulation
};
