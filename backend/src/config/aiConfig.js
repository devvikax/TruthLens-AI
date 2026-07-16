/**
 * AI Configuration Settings
 * Central settings file for timeouts, retries, and task routing.
 * Bypasses hardcoding provider-specific parameters.
 */

module.exports = {
  // Provider Priority per Pipeline
  routing: {
    speechToText: ['mock'], // whisper placeholder
    ocr: ['tesseract'],
    claimDecomposition: ['openrouter', 'gemini'],
    entityExtraction: ['openrouter', 'gemini'],
    contradictionAnalysis: ['openrouter', 'gemini'],
    consensusEvaluation: ['openrouter', 'gemini'],
    manipulationDetection: ['openrouter', 'gemini'],
    explainableNarrative: ['openrouter', 'gemini']
  },

  // Connection & Timeout specifications (in milliseconds)
  timeouts: {
    openrouter: 30000,
    gemini: 15000,
    tesseract: 20000,
    scraper: 8000
  },

  // Backoff retry settings for API failures
  retries: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffFactor: 2 // exponential backoff multiplier
  },

  // Rate Limiting settings (limits per hour)
  rateLimits: {
    guestLimit: 5,
    userLimit: 60
  }
};
