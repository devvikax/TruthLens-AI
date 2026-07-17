const cheerio = require('cheerio');

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
  const $ = cheerio.load(html);
  const results = [];

  $('.web-result').each((i, el) => {
    const a = $(el).find('a.result__a');
    const title = a.text().trim();
    const rawUrl = a.attr('href');
    
    // DDG HTML results sometimes prefix href with redirection links, let's extract it
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
 * Web Search with automatic failover chain:
 * DuckDuckGo Lite -> DuckDuckGo HTML -> Wikipedia Search API
 */
const searchWeb = async (query, limit = 5) => {
  const searchQueue = [
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
        // Mark which search provider was used
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
  searchWeb
};
