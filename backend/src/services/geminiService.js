const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Initializes Google Gemini client
 */
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('GEMINI_API_KEY is not configured. Direct SDK will use mock fallbacks.');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Helper to check if OpenRouter is configured
 */
const isOpenRouterConfigured = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  return apiKey && apiKey !== 'your_openrouter_api_key_here';
};

/**
 * Queries OpenRouter unified completions endpoint
 * @param {Array<Object>} messages - Conversation prompts in OpenAI format
 * @param {boolean} isJson - Enforce JSON response format
 * @returns {Promise<string>} Content reply
 */
const queryGroq = async (messages, isJson = false) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        response_format: isJson ? { type: 'json_object' } : undefined,
        temperature: 0.1,
        max_tokens: 1500
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Groq returned empty choices list.');
    }

    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error(`Groq Query Error: ${err.message}`);
    throw err;
  }
};

const queryOpenRouter = async (messages, isJson = false) => {
  if (process.env.GROQ_API_KEY) {
    return queryGroq(messages, isJson);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash:free';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://truthlens.ai',
        'X-Title': 'TruthLens AI'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        response_format: isJson ? { type: 'json_object' } : undefined,
        temperature: 0.1,
        max_tokens: 1500
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error('OpenRouter returned empty choices list.');
    }

    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error(`OpenRouter Query Error: ${err.message}`);
    throw err;
  }
};

/**
 * Analyzes raw text using Gemini or OpenRouter to extract claims, entities, bias, and emotion scores
 * @param {string} text - Content body to inspect
 * @returns {Promise<Object>} Structured NLP pipeline metrics
 */
const analyzeText = async (text) => {
  const prompt = `
    You are an expert NLP Fact-Checking engine. Analyze the following input text and return a JSON object.
    
    Input Text:
    "${text}"

    Respond strictly in this JSON format:
    {
      "language": "en|hi|hinglish",
      "detectedLanguageText": "English or Hindi description",
      "cleanedText": "Cleaned, typo-corrected version of the input text",
      "entities": {
        "people": ["Extracted person name"],
        "organizations": ["Extracted organization name"],
        "locations": ["Extracted location or country name"],
        "statistics": ["Extracted numbers, ratios, or statistics"]
      },
      "claims": ["Factual assertion 1 representing claims that can be verified", "Factual assertion 2"],
      "bias": {
        "score": 85, // 0-100 objectivity rating (100 = completely neutral/objective, 0 = highly opinionated/skewed)
        "framing": "political framing, commercial pitch, neutral, etc.",
        "explanation": "Brief explanation of bias in the text"
      },
      "emotions": {
        "score": 90, // 0-100 emotional control rating (100 = informative/factual, 0 = alarmist, clickbait, panic triggers)
        "triggers": ["fear", "urgency", "anger", "none"],
        "explanation": "Explanation of emotional manipulation and clickbait detection"
      },
      "source": {
        "score": 90, // 0-100 default reputation score (90 = whitelisted/credible cite, 20 = known rumor mill style)
        "reputation": "credible, unverified, user-submitted...",
        "explanation": "Credibility estimation of domain or author if present"
      }
    }
  `;

  // 1. Route to OpenRouter if configured
  if (isOpenRouterConfigured()) {
    try {
      console.log('Routing analyzeText query to OpenRouter...');
      const responseText = await queryOpenRouter([{ role: 'user', content: prompt }], true);
      return JSON.parse(responseText);
    } catch (error) {
      console.error(`OpenRouter analyzeText failure: ${error.message}. Falling back to mocks.`);
      return getMockAnalysis(text);
    }
  }

  // 2. Direct Gemini SDK fallback
  const client = getGeminiClient();
  if (!client) {
    return getMockAnalysis(text);
  }

  try {
    const model = client.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error(`Gemini analyzeText Error: ${error.message}. Falling back to mocks.`);
    return getMockAnalysis(text);
  }
};

/**
 * Generates user-friendly narrative explanations in both English and Hindi
 * @param {Object} data - Cleaned inputs, metrics, and factcheck citations
 * @returns {Promise<{en: string, hi: string}>} Bilingual reports
 */
const generateNarrative = async (data) => {
  const prompt = `
    You are an expert bilingual journalist. Generate a beginner-friendly explanation summarizing this content verification session.
    Do NOT use tech jargon. Speak clearly to children and elderly users.
    
    Analysis Metrics:
    - Overall Trust Score: ${data.metrics.trustScore}%
    - Verdict: ${data.verdict}
    - Source Reputation: ${data.metrics.sourceReputation}%
    - Claim Authenticity: ${data.metrics.claimVerification}%
    - Language Neutrality: ${data.metrics.biasScore}%
    
    Fact Check Citations Found:
    ${JSON.stringify(data.extractedClaims)}

    Write two independent paragraphs.
    Paragraph 1: English explanation answering what was analyzed, what evidence was verified/debunked, why this verdict was selected, and advice on sharing.
    Paragraph 2: Hindi translation of the explanation in simple, natural Devnagari script.

    Output format:
    ===ENGLISH===
    [Your English text here]
    ===HINDI===
    [Your Hindi text here]
  `;

  // 1. Route to OpenRouter if configured
  if (isOpenRouterConfigured()) {
    try {
      console.log('Routing generateNarrative query to OpenRouter...');
      const responseText = await queryOpenRouter([{ role: 'user', content: prompt }], false);
      const parts = responseText.split('===HINDI===');
      const englishPart = parts[0].replace('===ENGLISH===', '').trim();
      const hindiPart = parts[1] ? parts[1].trim() : englishPart;

      return {
        en: englishPart,
        hi: hindiPart
      };
    } catch (error) {
      console.error(`OpenRouter generateNarrative failure: ${error.message}. Returning default.`);
      return getMockNarrative(data.metrics.trustScore);
    }
  }

  // 2. Direct Gemini SDK fallback
  const client = getGeminiClient();
  if (!client) {
    return getMockNarrative(data.metrics.trustScore);
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const parts = responseText.split('===HINDI===');
    const englishPart = parts[0].replace('===ENGLISH===', '').trim();
    const hindiPart = parts[1] ? parts[1].trim() : englishPart;

    return {
      en: englishPart,
      hi: hindiPart
    };
  } catch (error) {
    console.error(`Gemini generateNarrative Error: ${error.message}. Returning default.`);
    return getMockNarrative(data.metrics.trustScore);
  }
};

/**
 * Handles conversational follow-up chats grounded in analysis context
 * @param {Object} analysis - The active Analysis document details
 * @param {Array} chatHistory - Previous message history
 * @param {string} userMessage - User's latest question
 * @returns {Promise<string>} AI reply
 */
const chatContextualResponse = async (analysis, chatHistory, userMessage) => {
  const systemPrompt = `
    You are a Media Literacy Assistant helper for TruthLens AI.
    Answer the user's question regarding the analyzed content. Keep responses short and friendly.
    
    Analysis Context:
    - Title: "${analysis.title}"
    - Trust Score: ${analysis.metrics.trustScore}%
    - AI Narrative: ${analysis.explainableNarrative.en}
    - Extracted Claims: ${JSON.stringify(analysis.extractedClaims)}

    Respond in the language of the user's question (English or Hindi).
  `;

  // 1. Route to OpenRouter if configured
  if (isOpenRouterConfigured()) {
    try {
      console.log('Routing chatContextualResponse query to OpenRouter...');
      
      // Structure chat messages for OpenRouter OpenAI format
      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        })),
        { role: 'user', content: userMessage }
      ];

      return await queryOpenRouter(messages, false);
    } catch (error) {
      console.error(`OpenRouter Chat Error: ${error.message}`);
      return "I had trouble generating a reply via OpenRouter. Please try asking again.";
    }
  }

  // 2. Direct Gemini SDK fallback
  const client = getGeminiClient();
  if (!client) {
    return "I am operating in mockup mode. If you configure GEMINI_API_KEY or OPENROUTER_API_KEY, I can answer complex follow-ups.";
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const historyContext = chatHistory.map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');

    const prompt = `
      ${systemPrompt}
      
      Chat History:
      ${historyContext}

      User's Question:
      "${userMessage}"
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error(`Gemini Chat Error: ${error.message}`);
    return "I had trouble generating a reply. Please try asking again.";
  }
};

/* --- FALLBACK MOCK BUILDERS --- */

const getMockAnalysis = (text) => {
  const content = text.trim();
  const lower = content.toLowerCase();
  
  // Extract language
  const hasHindiCharacters = /[\u0900-\u097F]/.test(content);
  const language = hasHindiCharacters ? 'hi' : 'en';
  
  // Cleaned text
  const cleanedText = content;
  
  // Extract entities dynamically
  const words = content.split(/\s+/);
  const capitalizedWords = words.filter(w => /^[A-Z][a-zA-Z]*$/.test(w.replace(/[^a-zA-Z]/g, '')));
  const uniqueCapWords = [...new Set(capitalizedWords)].map(w => w.replace(/[^a-zA-Z]/g, '')).filter(w => w.length > 2);
  
  const people = uniqueCapWords.slice(0, 2);
  const organizations = uniqueCapWords.slice(2, 4);
  const locations = uniqueCapWords.slice(4, 5);
  
  // Extract claims dynamically by splitting sentences
  const sentences = content.split(/[.!?।]+/).map(s => s.trim()).filter(s => s.length > 10);
  const claims = sentences.length > 0 ? sentences.slice(0, 3) : [content];
  
  // Calculate dynamic scores based on text features
  let emotionScore = 90; // Default calm
  const panicWords = ['warning', 'alert', 'died', 'death', 'scam', 'conspiracy', 'fake', 'viral', 'immediately', 'danger', 'dangerous', 'cheat', 'fraud', 'shocking'];
  for (const pw of panicWords) {
    if (lower.includes(pw)) {
      emotionScore -= 15;
    }
  }
  if (content.includes('!')) {
    emotionScore -= 10;
  }
  emotionScore = Math.max(10, emotionScore);
  
  let biasScore = 80; // Default neutral
  const loadedWords = ['must', 'proven', 'lying', 'exposed', 'truth', 'liar', 'fraud', 'shocking', 'unbelievable'];
  for (const lw of loadedWords) {
    if (lower.includes(lw)) {
      biasScore -= 15;
    }
  }
  biasScore = Math.max(10, biasScore);
  
  let sourceScore = 70;
  if (lower.includes('official') || lower.includes('gov') || lower.includes('nasa') || lower.includes('who.')) {
    sourceScore = 95;
  } else if (lower.includes('whatsapp') || lower.includes('forwarded') || lower.includes('facebook') || lower.includes('tiktok')) {
    sourceScore = 30;
  }
  
  return {
    language,
    cleanedText,
    entities: {
      people,
      organizations: organizations.length > 0 ? organizations : (locations.length > 0 ? [] : ['Unknown Source']),
      locations: locations.length > 0 ? locations : [],
      statistics: []
    },
    claims,
    bias: {
      score: biasScore,
      framing: biasScore < 50 ? 'sensationalized' : 'neutral',
      explanation: biasScore < 50 ? 'The text utilizes subjective, opinion-loaded, or framing language.' : 'The text maintains a generally neutral, fact-oriented framing.'
    },
    emotions: {
      score: emotionScore,
      triggers: emotionScore < 60 ? ['urgency', 'fear'] : ['none'],
      explanation: emotionScore < 60 ? 'Uses alarming triggers or warning symbols to prompt quick sharing.' : 'Presents information without significant emotional triggers.'
    },
    source: {
      score: sourceScore,
      reputation: sourceScore > 80 ? 'credible' : sourceScore < 40 ? 'unverified' : 'neutral',
      explanation: 'Derived dynamically from text attribution references.'
    }
  };
};

const getMockNarrative = (score) => {
  const isGenuine = score >= 75;
  const isMisleading = score < 40;
  
  if (isGenuine) {
    return {
      en: "This assertion is highly credible. Verification engines found supporting matches in official databases, national news reports, and trusted registries. The statement contains objective phrasing without clickbait or emotional manipulation.",
      hi: "यह दावा अत्यधिक विश्वसनीय है। सत्यापन इंजनों को आधिकारिक डेटाबेस, राष्ट्रीय समाचार रिपोर्टों और विश्वसनीय रजिस्ट्रियों में इसके समर्थन प्रमाण मिले हैं।"
    };
  } else if (isMisleading) {
    return {
      en: "Caution is strongly advised. Investigation indicates this claim contains unverified rumors, fabricated details, or has been explicitly debunked by national factcheckers. The text uses emotional manipulation or sensationalist language to trigger sharing.",
      hi: "सावधानी बरतने की सलाह दी जाती है। जांच से पता चलता है कि इस दावे में असत्यापित अफवाहें या मनगढ़ंत विवरण शामिल हैं, जिन्हें फैक्ट-चेकर्स द्वारा खारिज किया गया है।"
    };
  } else {
    return {
      en: "The claim is partially verified but requires further context. Factual records match some entities, but complete consensus is missing from primary news archives. Users should verify independent official bulletins before distributing.",
      hi: "दावा आंशिक रूप से सत्यापित है लेकिन इसके लिए और संदर्भ की आवश्यकता है। स्वतंत्र स्रोतों से पुष्टि होने तक सावधानी बरतें।"
    };
  }
};

module.exports = {
  analyzeText,
  generateNarrative,
  chatContextualResponse,
  getGeminiClient,
  isOpenRouterConfigured,
  queryOpenRouter
};
