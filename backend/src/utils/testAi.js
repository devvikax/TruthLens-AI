require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { calculateTrustScore } = require('./trustCalculator');
const { scrapeUrl } = require('../services/scraperService');
const { searchFactChecks } = require('../services/searchService');
const { analyzeText, generateNarrative } = require('../services/geminiService');

const runValidation = async () => {
  console.log('=== STARTING TRUTHLENS AI PIPELINE SELF-VALIDATION ===\n');

  // 1. Validate Trust Calculator Engine
  console.log('Step 1: Testing Trust Calculator Engine...');
  const mockMetrics = {
    sourceReputation: 90,
    biasScore: 85,
    claimVerification: 95,
    emotionScore: 90
  };
  const scoreResult = calculateTrustScore(mockMetrics);
  console.log(`- Weighted Score Output: ${scoreResult.trustScore}%`);
  console.log(`- Verdict Resolved: ${scoreResult.verdict}`);
  if (scoreResult.trustScore === 91 && scoreResult.verdict.includes('Genuine')) {
    console.log('✅ Trust Score Engine passed validation.\n');
  } else {
    console.log('⚠️ Trust Score Engine returned unexpected values.\n');
  }

  // 2. Validate URL Readability Scraper
  console.log('Step 2: Testing Cheerio Scraper Service...');
  try {
    const scraped = await scrapeUrl('https://science.nasa.gov');
    console.log(`- Page Title Extracted: "${scraped.title}"`);
    console.log(`- Clean Content Body Length: ${scraped.body.length} chars`);
    if (scraped.title && scraped.body.length > 0) {
      console.log('✅ Scraper Service passed validation.\n');
    } else {
      console.log('⚠️ Scraper extracted empty values.\n');
    }
  } catch (err) {
    console.log(`⚠️ Scraper encountered error: ${err.message}. (Offline / connection block)\n`);
  }

  // 3. Validate Fact Check Search Service
  console.log('Step 3: Testing Google Fact Check Search queries...');
  try {
    const results = await searchFactChecks('COVID-19 vaccine microchip');
    console.log(`- API Search Matches: ${results.length} records found`);
    console.log('✅ Fact Check Service passed validation.\n');
  } catch (err) {
    console.log(`⚠️ Fact Check Service failed: ${err.message}\n`);
  }

  // 4. Validate Gemini Prompts
  console.log('Step 4: Testing Gemini prompt extraction...');
  try {
    const textInput = "NASA James Webb Space Telescope confirms ancient galaxy formed 400 million years after the Big Bang.";
    const analysis = await analyzeText(textInput);
    console.log(`- Language Detected: ${analysis.language}`);
    console.log(`- Extracted Claims Count: ${analysis.claims ? analysis.claims.length : 0}`);
    console.log(`- Sentiment Emotion Triggers: ${analysis.emotions ? analysis.emotions.triggers.join(', ') : 'none'}`);
    
    // Test Narrative synthesis
    const narrative = await generateNarrative({
      metrics: { trustScore: 94, sourceReputation: 98, biasScore: 92, claimVerification: 95, emotionScore: 90 },
      extractedClaims: [],
      verdict: '🟢 Likely Genuine'
    });
    console.log(`- Narrative Summary (EN): "${narrative.en.substring(0, 80)}..."`);
    console.log(`- Narrative Summary (HI): "${narrative.hi.substring(0, 80)}..."`);

    console.log('✅ Gemini Prompt Service passed validation.\n');
  } catch (err) {
    console.log(`⚠️ Gemini Prompt Service failed: ${err.message}\n`);
  }

  console.log('=== SELF-VALIDATION COMPLETE ===');
};

runValidation();
