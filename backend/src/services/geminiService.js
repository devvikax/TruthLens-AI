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
const queryOpenRouter = async (messages, isJson = false) => {
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
  const content = text.toLowerCase();
  
  if (content.includes('nasa') || content.includes('galaxy')) {
    return {
      language: "en",
      cleanedText: text,
      entities: { people: ["James Webb"], organizations: ["NASA"], locations: ["Big Bang"], statistics: ["400 million years"] },
      claims: ["James Webb Telescope detected a galaxy from 400 million years after the Big Bang.", "Findings are supported by peer-reviewed spectroscopic verification."],
      bias: { score: 92, framing: "neutral", explanation: "Completely objective scientific tone." },
      emotions: { score: 90, triggers: ["none"], explanation: "Informational and non-sensational." },
      source: { score: 98, reputation: "whitelisted", explanation: "NASA domain represents high scientific authority." }
    };
  } else if (content.includes('battery') || content.includes('phone') || content.includes('update')) {
    return {
      language: "en",
      cleanedText: text,
      entities: { people: ["Forums users"], organizations: ["TechCheck"], locations: [], statistics: ["14.2"] },
      claims: ["OS version 14.2 update causes phone batteries to swell and explode.", "Phones are overheating within minutes."],
      bias: { score: 50, framing: "user rumors", explanation: "Presents forum hearsay as confirmed dangers." },
      emotions: { score: 35, triggers: ["fear", "urgency"], explanation: "Uses warning emojis and panic language." },
      source: { score: 40, reputation: "unverified", explanation: "Origins from unverified forum posts." }
    };
  } else {
    // Default Misleading/Rumor mock
    return {
      language: "hi",
      cleanedText: text,
      entities: { people: [], organizations: ["Big Pharma"], locations: [], statistics: [] },
      claims: ["Drinking lemon juice and baking soda in hot water cures and prevents all viral infections.", "Conspiracy: Big Pharma hides this remedy."],
      bias: { score: 10, framing: "conspiratorial", explanation: "Highly loaded anti-pharma framing." },
      emotions: { score: 8, triggers: ["panic", "conspiracy"], explanation: "Demands immediate sharing using alarmist keywords." },
      source: { score: 5, reputation: "blacklist", explanation: "Classic health-scam rumor template." }
    };
  }
};

const getMockNarrative = (score) => {
  if (score >= 75) {
    return {
      en: "This article is highly credible. It presents verified facts backed by peer-reviewed scientific institutions. The language is entirely objective, with no emotional bias or sensationalized claims.",
      hi: "यह लेख अत्यधिक विश्वसनीय है। इसमें दी गई जानकारी पूरी तरह से वैज्ञानिक तथ्यों पर आधारित है। इसमें कोई भड़काऊ या सनसनीखेज भाषा का उपयोग नहीं किया गया है।"
    };
  } else if (score >= 40) {
    return {
      en: "Caution is advised. While a small percentage of users reported issues, there is no verified proof of batteries exploding. The warning utilizes sensationalist, panic-inducing language.",
      hi: "सावधानी बरतने की सलाह दी जाती है। हालांकि कुछ उपयोगकर्ताओं ने गर्म होने की शिकायत की है, लेकिन बैटरी फटने का कोई प्रमाणित सबूत नहीं है।"
    };
  } else {
    return {
      en: "This post is highly misleading and debunked. Medical organizations confirm that lemon and baking soda do not cure viral infections. The text relies heavily on emotional manipulation to trigger shares.",
      hi: "यह पोस्ट अत्यधिक भ्रामक और गलत है। स्वास्थ्य संगठनों ने पुष्टि की है कि नींबू और बेकिंग सोडा वायरल संक्रमणों का इलाज नहीं करता है।"
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
