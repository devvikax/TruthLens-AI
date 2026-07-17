const cheerio = require('cheerio');

const unwrapBingUrl = (url) => {
  if (url.includes('bing.com/ck/a?!') && url.includes('u=')) {
    try {
      const urlObj = new URL(url);
      const uParam = urlObj.searchParams.get('u');
      if (uParam) {
        const base64Str = uParam.substring(2);
        const padded = base64Str.padEnd(base64Str.length + (4 - base64Str.length % 4) % 4, '=');
        const decoded = Buffer.from(padded, 'base64').toString('utf-8');
        if (decoded.startsWith('http')) {
          return decoded;
        }
      }
    } catch (e) {
      console.warn(`Failed to unwrap Bing redirect URL: ${url}`, e.message);
    }
  }
  return url;
};

/**
 * Bing Search Crawler (GET)
 */
const queryBing = async (query, limit = 5) => {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    signal: AbortSignal.timeout(6000)
  });

  if (!response.ok) {
    throw new Error(`Bing Search HTTP Status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const results = [];

  $('.b_algo').each((i, el) => {
    const a = $(el).find('h2 a');
    const title = a.text().trim();
    let href = a.attr('href');
    const snippet = $(el).find('.b_caption p, p').first().text().trim();
    
    if (href) {
      href = unwrapBingUrl(href);
    }

    let source = 'Web Search';
    try {
      const parsed = new URL(href);
      source = parsed.hostname.replace('www.', '');
    } catch (e) {}

    if (title && href && href.startsWith('http')) {
      results.push({
        title,
        url: href,
        snippet: snippet || title,
        source,
        category: 'Category F: Live Web Search',
        date: new Date().toISOString().split('T')[0]
      });
    }
  });

  return results.slice(0, limit);
};

/**
 * Yahoo Search Crawler (GET)
 */
const queryYahoo = async (query, limit = 5) => {
  const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    signal: AbortSignal.timeout(6000)
  });

  if (!response.ok) {
    throw new Error(`Yahoo Search HTTP Status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const results = [];

  $('.algo').each((i, el) => {
    const a = $(el).find('h3 a');
    const title = a.text().trim();
    const href = a.attr('href');
    const snippet = $(el).find('.compText, p').first().text().trim();
    
    let source = 'Web Search';
    try {
      const parsed = new URL(href);
      source = parsed.hostname.replace('www.', '');
    } catch (e) {}

    if (title && href && href.startsWith('http')) {
      results.push({
        title,
        url: href,
        snippet: snippet || title,
        source,
        category: 'Category F: Live Web Search',
        date: new Date().toISOString().split('T')[0]
      });
    }
  });

  return results.slice(0, limit);
};

/**
 * DuckDuckGo Lite crawler (POST)
 */
const queryDdgLite = async (query, limit = 5) => {
  const response = await fetch('https://lite.duckduckgo.com/lite/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    body: `q=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(6000)
  });

  if (!response.ok) {
    throw new Error(`DDG Lite HTTP Status ${response.status}`);
  }

  const html = await response.text();
  
  // Return early if challenged or blocked
  if (response.status === 202 || html.includes('captcha') || html.includes('challenge')) {
    throw new Error(`DDG Lite served CAPTCHA/redirection challenge`);
  }

  const $ = cheerio.load(html);
  const results = [];

  $('a.result-link').each((i, el) => {
    const a = $(el);
    const title = a.text().trim();
    const rawUrl = a.attr('href');
    
    let url = rawUrl;
    if (rawUrl.startsWith('//')) {
      url = 'https:' + rawUrl;
    }
    
    const tr = a.closest('tr');
    const snippetTr = tr.next();
    const snippet = snippetTr.find('td.result-snippet').text().trim();
    
    let source = 'Web Search';
    try {
      const parsed = new URL(url);
      source = parsed.hostname.replace('www.', '');
    } catch (e) {}

    if (title && url && url.startsWith('http')) {
      results.push({
        title,
        url,
        snippet: snippet || title,
        source,
        category: 'Category F: Live Web Search',
        date: new Date().toISOString().split('T')[0]
      });
    }
  });

  return results.slice(0, limit);
};

/**
 * DuckDuckGo HTML crawler (GET)
 */
const queryDdgHtml = async (query, limit = 5) => {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    },
    signal: AbortSignal.timeout(6000)
  });

  if (!response.ok) {
    throw new Error(`DDG HTML HTTP Status ${response.status}`);
  }

  const html = await response.text();
  
  if (response.status === 202 || html.includes('captcha') || html.includes('challenge')) {
    throw new Error(`DDG HTML served CAPTCHA/redirection challenge`);
  }

  const $ = cheerio.load(html);
  const results = [];

  $('.web-result').each((i, el) => {
    const a = $(el).find('a.result__a');
    const title = a.text().trim();
    const rawUrl = a.attr('href');
    
    let cleanUrl = rawUrl;
    if (rawUrl && rawUrl.includes('uddg=')) {
      try {
        const parts = rawUrl.split('uddg=');
        cleanUrl = decodeURIComponent(parts[1].split('&')[0]);
      } catch (e) {}
    }

    const snippet = $(el).find('.result__snippet').text().trim();
    
    let source = 'Web Search';
    try {
      const parsed = new URL(cleanUrl);
      source = parsed.hostname.replace('www.', '');
    } catch (e) {}

    if (title && cleanUrl && cleanUrl.startsWith('http')) {
      results.push({
        title,
        url: cleanUrl,
        snippet: snippet || title,
        source,
        category: 'Category F: Live Web Search',
        date: new Date().toISOString().split('T')[0]
      });
    }
  });

  return results.slice(0, limit);
};

/**
 * Wikipedia Search API Helper (No API key required)
 */
const queryWikipedia = async (query, limit = 3) => {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    throw new Error(`Wikipedia Search HTTP Status ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.query || !data.query.search) return [];

  return data.query.search.slice(0, limit).map(item => ({
    title: item.title,
    snippet: item.snippet.replace(/<[^>]*>/g, '').trim(), 
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
    source: 'Wikipedia',
    category: 'Category E: Knowledge Sources (Wikipedia)',
    date: new Date().toISOString().split('T')[0]
  }));
};

/**
 * Serper API (Google Search - POST)
 * Requires SERPER_API_KEY
 */
const querySerper = async (query, limit = 5) => {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey || apiKey === 'your_serper_api_key_here') {
    throw new Error('Serper API Key not configured.');
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: query,
      num: limit
    }),
    signal: AbortSignal.timeout(6000)
  });

  if (!response.ok) {
    throw new Error(`Serper HTTP Error status ${response.status}`);
  }

  const data = await response.json();
  const organic = data.organic || [];

  return organic.map(item => {
    let source = 'Serper Search';
    try {
      const parsed = new URL(item.link);
      source = parsed.hostname.replace('www.', '');
    } catch (e) {}

    return {
      title: item.title || 'Untitled',
      url: item.link,
      snippet: item.snippet || item.title || '',
      source,
      category: 'Category F: Live Web Search',
      date: item.date || new Date().toISOString().split('T')[0]
    };
  });
};

/**
 * Tavily Search API (POST)
 * Requires TAVILY_API_KEY
 */
const queryTavily = async (query, limit = 5) => {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey === 'your_tavily_api_key_here') {
    throw new Error('Tavily API Key not configured.');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: query,
      max_results: limit
    }),
    signal: AbortSignal.timeout(6000)
  });

  if (!response.ok) {
    throw new Error(`Tavily HTTP Error status ${response.status}`);
  }

  const data = await response.json();
  const results = data.results || [];

  return results.map(item => {
    let source = 'Tavily Search';
    try {
      const parsed = new URL(item.url);
      source = parsed.hostname.replace('www.', '');
    } catch (e) {}

    return {
      title: item.title || 'Untitled',
      url: item.url,
      snippet: item.content || item.title || '',
      source,
      category: 'Category F: Live Web Search',
      date: new Date().toISOString().split('T')[0]
    };
  });
};

/**
 * Brave Search API (GET)
 * Requires BRAVE_SEARCH_API_KEY
 */
const queryBrave = async (query, limit = 5) => {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey || apiKey === 'your_brave_search_api_key_here') {
    throw new Error('Brave Search API Key not configured.');
  }

  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.search = new URLSearchParams({
    q: query,
    count: limit.toString()
  }).toString();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Subscription-Token': apiKey
    },
    signal: AbortSignal.timeout(6000)
  });

  if (!response.ok) {
    throw new Error(`Brave Search HTTP Error status ${response.status}`);
  }

  const data = await response.json();
  const rawResults = (data.web && data.web.results) || [];
  
  return rawResults.map(item => {
    let source = 'Brave Search';
    try {
      const parsed = new URL(item.url);
      source = parsed.hostname.replace('www.', '');
    } catch (e) {}

    return {
      title: item.title || 'Untitled',
      url: item.url,
      snippet: item.description || item.title || '',
      source,
      category: 'Category F: Live Web Search',
      date: item.page_age || new Date().toISOString().split('T')[0]
    };
  });
};

/**
 * Web Search with automatic failover chain:
 * Serper API -> Tavily Search API -> Brave Search API -> Bing -> Yahoo -> DuckDuckGo Lite -> DuckDuckGo HTML -> Wikipedia Search API
 */
const searchWeb = async (query, limit = 5) => {
  const searchQueue = [
    { name: 'Serper API', fn: () => querySerper(query, limit) },
    { name: 'Tavily Search API', fn: () => queryTavily(query, limit) },
    { name: 'Brave Search API', fn: () => queryBrave(query, limit) },
    { name: 'Bing Search', fn: () => queryBing(query, limit) },
    { name: 'Yahoo Search', fn: () => queryYahoo(query, limit) },
    { name: 'DuckDuckGo Lite', fn: () => queryDdgLite(query, limit) },
    { name: 'DuckDuckGo HTML', fn: () => queryDdgHtml(query, limit) },
    { name: 'Wikipedia Search API', fn: () => queryWikipedia(query, limit) }
  ];

  for (const provider of searchQueue) {
    try {
      console.log(`- Web Search: Querying provider [${provider.name}] for: "${query}"`);
      const results = await provider.fn();
      if (results && results.length > 0) {
        console.log(`- Web Search: Provider [${provider.name}] successfully returned ${results.length} candidate links.`);
        return results.map(r => ({ ...r, searchProvider: provider.name }));
      }
      console.warn(`- Web Search: Provider [${provider.name}] returned 0 results. Trying next failover...`);
    } catch (err) {
      console.warn(`- Web Search: Provider [${provider.name}] failed with error: ${err.message}. Trying next failover...`);
    }
  }

  console.error(`- Web Search: All search providers in failover chain failed for query: "${query}"`);
  return [];
};

module.exports = {
  searchWeb,
  querySerper,
  queryTavily,
  queryBrave
};
