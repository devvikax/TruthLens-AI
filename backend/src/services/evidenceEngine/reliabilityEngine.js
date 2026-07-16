/**
 * Step 5: Source Reliability Engine
 * Computes a reliability score (0-100) for a source based on reputation signals and domain metadata
 */

const OFFICIAL_DOMAINS = [
  'gov', 'nic.in', 'gov.in', 'who.int', 'nasa.gov', 'isro.gov.in',
  'edu', 'ac.in', 'pib.gov.in', 'mil'
];

const TRUSTED_MEDIA = [
  'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'afp.com',
  'thehindu.com', 'indianexpress.com', 'ndtv.com', 'altnews.in',
  'snopes.com', 'factcheck.org', 'politifact.com', 'boomlive.in',
  'wikipedia.org'
];

const BLACKLIST_DOMAINS = [
  'blogspot.com', 'wordpress.com', 'whatsapp-forward.org', 'conspiracy-theory.net'
];

/**
 * Calculates reliability score for a source url or publisher
 * @param {string} url - Source URL
 * @param {string} sourceName - Source/publisher name
 * @returns {Object} Score details (0-100 rating and explanation)
 */
const calculateSourceReliability = (url = '', sourceName = '') => {
  let score = 50; // base score for unknown domains
  let signals = [];

  const lowerUrl = url.toLowerCase();
  const lowerSource = sourceName.toLowerCase();

  // 1. Check domain extensions
  let hostname = '';
  try {
    if (lowerUrl.startsWith('http')) {
      const parsed = new URL(lowerUrl);
      hostname = parsed.hostname;
    }
  } catch (err) {
    // Treat as raw string match
    hostname = lowerUrl;
  }

  // Official domains (.gov, .edu, WHO, NASA)
  const isOfficial = OFFICIAL_DOMAINS.some(domain => hostname.endsWith(domain) || lowerUrl.includes(domain));
  if (isOfficial) {
    score += 45;
    signals.push('Official domain (.gov, .edu, WHO, NASA)');
  }

  // Trusted news & fact-checking outlets
  const isTrustedMedia = TRUSTED_MEDIA.some(media => hostname.includes(media) || lowerSource.includes(media.split('.')[0]));
  if (isTrustedMedia) {
    score += 35;
    signals.push('Trusted news / fact-checking organization');
  }

  // Spammers / bloggers blacklist
  const isBlacklisted = BLACKLIST_DOMAINS.some(bad => hostname.includes(bad));
  if (isBlacklisted) {
    score -= 40;
    signals.push('Suspicious self-publishing / blog domain');
  }

  // Cap scores between 5 and 100
  score = Math.max(5, Math.min(100, score));

  return {
    score,
    isOfficial,
    isTrusted: isTrustedMedia || isOfficial,
    explanation: signals.length > 0 
      ? `Source verified via: ${signals.join(', ')}`
      : 'Unverified source; evaluated as baseline citizen reporter.'
  };
};

module.exports = {
  calculateSourceReliability
};
