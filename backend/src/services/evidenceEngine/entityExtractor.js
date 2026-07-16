const { orchestrateAiTask } = require('../aiOrchestrator');

/**
 * Step 3: Entity Extraction
 * Extracts key semantic targets (People, Orgs, Locations, Stats, Dates, Events) to focus query crawlers
 * @param {string} text - Cleaned input corpus
 * @returns {Promise<Object>} Object containing categorized entities
 */
const extractEntities = async (text) => {
  const prompt = `
    Analyze the following text and extract all notable entities.
    
    Text:
    "${text}"

    Respond strictly in this JSON format:
    {
      "people": ["Name 1"],
      "organizations": ["Organization 1"],
      "countries": ["Country 1"],
      "locations": ["Specific Location 1"],
      "dates": ["Date 1"],
      "events": ["Event name or description"],
      "numbers": ["Raw numbers/quantities"],
      "statistics": ["Statistical ratios or percentages"],
      "quotes": ["Significant verbatim statements"]
    }
  `;

  try {
    const responseText = await orchestrateAiTask('entityExtraction', prompt, true);
    return JSON.parse(responseText);
  } catch (err) {
    console.error(`AI Orchestrator entity extraction failed: ${err.message}. Returning empty object.`);
    return getFallbackEntities();
  }
};

const getFallbackEntities = () => {
  return {
    people: [],
    organizations: [],
    countries: [],
    locations: [],
    dates: [],
    events: [],
    numbers: [],
    statistics: [],
    quotes: []
  };
};

module.exports = {
  extractEntities
};
