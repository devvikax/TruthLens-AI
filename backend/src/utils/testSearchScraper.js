const cheerio = require('cheerio');

const testSearch = async () => {
  const query = 'Virat Kohli';
  console.log(`Testing search for: ${query}`);
  try {
    const response = await fetch('https://lite.duckduckgo.com/lite/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: `q=${encodeURIComponent(query)}`
    });

    console.log(`Response status: ${response.status}`);
    if (!response.ok) {
      console.log('Search request failed.');
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];

    $('a.result-link').each((i, el) => {
      const a = $(el);
      const title = a.text().trim();
      const url = a.attr('href');
      
      // DuckDuckGo Lite places the snippet in a td with class 'result-snippet'
      // which is typically inside a sibling tr.
      const tr = a.closest('tr');
      const snippetTr = tr.next();
      const snippet = snippetTr.find('td.result-snippet').text().trim();
      
      results.push({
        title,
        url,
        snippet
      });
    });

    console.log(`Found ${results.length} results:`);
    console.log(JSON.stringify(results.slice(0, 3), null, 2));

  } catch (err) {
    console.error(`Search error: ${err.message}`);
  }
};

testSearch();
