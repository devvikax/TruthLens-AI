const aiConfig = require('../config/aiConfig');
const { logTelemetry } = require('./observability');
const { getGeminiClient, isOpenRouterConfigured, queryOpenRouter } = require('./geminiService');
const { AsyncLocalStorage } = require('async_hooks');

const aiLocalStorage = new AsyncLocalStorage();

/**
 * Helper to pause execution (delay backoffs)
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes a specific prompt against OpenRouter completion APIs
 */
const executeOpenRouter = async (prompt, isJson, timeoutLimit) => {
  const messages = [{ role: 'user', content: prompt }];
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash:free';

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
    signal: AbortSignal.timeout(timeoutLimit)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) {
    throw new Error('OpenRouter returned empty choices.');
  }

  return data.choices[0].message.content.trim();
};

/**
 * Executes a specific prompt directly against the Google Gemini SDK
 */
const executeGeminiSDK = async (prompt, isJson, timeoutLimit) => {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Google Gemini Direct SDK is not configured.');
  }

  // We enforce timeout limit inside a Promise wrapper because the Google SDK has its own connection handlers
  const executionPromise = (async () => {
    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: isJson ? { responseMimeType: 'application/json' } : undefined
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  })();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Google Gemini Direct SDK Query timed out')), timeoutLimit)
  );

  return Promise.race([executionPromise, timeoutPromise]);
};

/**
 * AI Orchestrator Core Task Router
 * routes task requests through priority pipelines and applies retry & failover configurations
 * @param {string} taskName - Name of task pipeline (e.g. 'claimDecomposition')
 * @param {string} prompt - Message content payload
 * @param {boolean} isJson - Enforce JSON response format
 * @returns {Promise<string>} Model response text
 */
const orchestrateAiTask = async (taskName, prompt, isJson = false) => {
  const priorityList = aiConfig.routing[taskName] || ['openrouter', 'gemini'];
  
  let lastError = null;

  for (const provider of priorityList) {
    // 1. Skip if provider is not configured
    if (provider === 'openrouter' && !isOpenRouterConfigured()) {
      continue;
    }
    if (provider === 'gemini' && !getGeminiClient()) {
      continue;
    }

    const timeoutLimit = aiConfig.timeouts[provider] || 15000;
    let attempt = 0;
    let delay = aiConfig.retries.initialDelayMs;

    while (attempt < aiConfig.retries.maxAttempts) {
      attempt++;
      const startTime = performance.now();
      
      try {
        console.log(`- AI Orchestrator routing [${taskName}] to [${provider}] (Attempt ${attempt}/${aiConfig.retries.maxAttempts})...`);
        let reply = '';

        if (provider === 'openrouter') {
          reply = await executeOpenRouter(prompt, isJson, timeoutLimit);
        } else if (provider === 'gemini') {
          reply = await executeGeminiSDK(prompt, isJson, timeoutLimit);
        } else {
          throw new Error(`Unsupported provider config: ${provider}`);
        }

        const endTime = performance.now();
        logTelemetry({
          task: taskName,
          provider: provider,
          latencyMs: Math.round(endTime - startTime),
          status: 'success',
          retryCount: attempt - 1,
          tokensEstimated: Math.round(prompt.length / 4)
        });

        // Save trace telemetry for sandbox debugging
        const store = aiLocalStorage.getStore();
        if (store) {
          store.push({
            taskName,
            provider,
            prompt,
            response: reply,
            status: 'success',
            latencyMs: Math.round(endTime - startTime),
            timestamp: new Date().toISOString()
          });
        }

        return reply; // Succeeded!
      } catch (err) {
        lastError = err;
        const endTime = performance.now();
        
        logTelemetry({
          task: taskName,
          provider: provider,
          latencyMs: Math.round(endTime - startTime),
          status: 'failure',
          retryCount: attempt - 1,
          errorClass: err.message
        });

        const store = aiLocalStorage.getStore();
        if (store) {
          store.push({
            taskName,
            provider,
            prompt,
            response: err.message,
            status: 'failure',
            latencyMs: Math.round(endTime - startTime),
            timestamp: new Date().toISOString()
          });
        }

        console.warn(`[Warning] Attempt ${attempt} failed with error: ${err.message}.`);
        
        const errMsg = err.message || '';
        const isClientAuthError = errMsg.includes('402') || errMsg.includes('401') || errMsg.includes('403');
        if (isClientAuthError) {
          console.warn(`[Warning] Client credentials or billing error (401/402/403) detected. Skipping retrying.`);
          break;
        }

        if (attempt < aiConfig.retries.maxAttempts) {
          // Pause with exponential backoff before retrying
          console.log(`- Pausing for ${delay}ms before retry...`);
          await sleep(delay);
          delay *= aiConfig.retries.backoffFactor;
        }
      }
    }

    // Attempt count exceeded for this provider; fall over to next provider in priority list
    console.warn(`[Warning] Provider [${provider}] failed all attempts. Falling over to next provider.`);
  }

  // All providers failed
  throw new Error(`AI Orchestrator failed to execute [${taskName}] across all configured providers. Last error: ${lastError ? lastError.message : 'Unknown'}`);
};

module.exports = {
  orchestrateAiTask,
  aiLocalStorage
};
