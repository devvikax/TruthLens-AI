const { getGeminiClient, isOpenRouterConfigured, queryOpenRouter } = require('../../geminiService');

/**
 * Helper to query Wikipedia Search API (no key required)
 */
const searchWikipedia = async (query) => {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data.query || !data.query.search) return [];

    return data.query.search.slice(0, 1).map(item => ({
      title: item.title,
      snippet: item.snippet.replace(/<[^>]*>/g, ''), // strip tags
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
      source: 'Wikipedia',
      category: 'Category E: Knowledge Sources (Wikipedia)',
      date: new Date().toISOString().split('T')[0]
    }));
  } catch (err) {
    console.error(`Wikipedia search failed: ${err.message}`);
    return [];
  }
};

/**
 * Web Search Adapter
 * Queries Wikipedia and simulated web crawlers for general knowledge references
 */
const search = async (query, limit = 2) => {
  const wikiResults = await searchWikipedia(query);
  
  const prompt = `
    Perform a simulated, high-fidelity live web crawl for this query.
    Query: "${query}"

    Extract up to ${limit} matching general web articles or blog summaries.
    Respond strictly with a JSON array of objects following this format:
    [
      {
        "title": "Page title of matching website",
        "snippet": "1-2 sentence excerpt of facts, datasets, or consensus findings.",
        "url": "https://source-domain.com/path-to-post",
        "source": "General Blog|News Outlet",
        "category": "Category F: Live Web Search",
        "date": "2026-07-16"
      }
    ]
  `;

  let crawledResults = [];
  if (isOpenRouterConfigured()) {
    try {
      const responseText = await queryOpenRouter([{ role: 'user', content: prompt }], true);
      crawledResults = JSON.parse(responseText);
    } catch (err) {
      crawledResults = getFallback(query);
    }
  } else {
    const client = getGeminiClient();
    if (client) {
      try {
        const model = client.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });
        const result = await model.generateContent(prompt);
        crawledResults = JSON.parse(result.response.text());
      } catch (err) {
        crawledResults = getFallback(query);
      }
    } else {
      crawledResults = getFallback(query);
    }
  }

  return [...wikiResults, ...crawledResults];
};

const getFallback = (query) => {
  return [
    {
      title: `Web Index results for ${query}`,
      snippet: `General search crawls compiled references concerning the query: ${query}.`,
      url: 'https://google.com/search',
      source: 'Google Search Index',
      category: 'Category F: Live Web Search',
      date: new Date().toISOString().split('T')[0]
    }
  ];
};

module.exports = {
  search
};
