const cheerio = require('cheerio');

/**
 * Scrapes body content from a target URL
 * @param {string} url - Target URL to inspect
 * @returns {Promise<{title: string, body: string, metaDescription: string}>} Cleaned article data
 */
const scrapeUrl = async (url) => {
  try {
    // Add default protocol if missing
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      targetUrl = 'https://' + url;
    }

    // Fetch raw HTML (using simple node fetch client)
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(8000) // 8-second network timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch web page: HTTP Status ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove boilerplate elements
    $('script, style, nav, footer, iframe, header, noscript, .ads, #ads, .comments, #comments').remove();

    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Scraped Article';

    // Extract meta description
    const metaDescription = $('meta[name="description"]').attr('content') || '';

    // Locate core article content containers
    let body = '';
    const mainSelectors = ['article', 'main', '[role="main"]', '.post-content', '.article-body', '.entry-content', '.content-body'];
    
    for (const selector of mainSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        // Concatenate paragraph blocks
        el.find('p').each((_, p) => {
          body += $(p).text().trim() + '\n';
        });
        if (body.trim().length > 150) break; // If we found substantial text, stop searching
      }
    }

    // Fallback: If no article containers found, pull all paragraphs from page
    if (!body.trim()) {
      $('p').each((_, p) => {
        const text = $(p).text().trim();
        // Skip short boilerplate paragraphs
        if (text.length > 30) {
          body += text + '\n';
        }
      });
    }

    // Secondary fallback: Pull all text from body tag
    if (!body.trim()) {
      body = $('body').text().replace(/\s+/g, ' ').trim();
    }

    return {
      title,
      body: body.trim(),
      metaDescription
    };
  } catch (error) {
    console.error(`Scraper Service Error: ${error.message}`);
    throw new Error(`Web scraper failure: ${error.message}`);
  }
};

module.exports = { scrapeUrl };
