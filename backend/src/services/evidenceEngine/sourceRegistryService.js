const SourceRegistry = require('../../models/SourceRegistry');

const INITIAL_SEEDS = [
  {
    name: 'Reuters',
    domain: 'reuters.com',
    category: 'International News',
    country: 'United Kingdom',
    language: 'English',
    publisherType: 'Wire Service',
    officialStatus: false,
    knownReliability: 96,
    transparency: 95,
    updateFrequency: 'Real-time',
    verificationMethod: 'Journalistic Audit'
  },
  {
    name: 'Associated Press',
    domain: 'apnews.com',
    category: 'International News',
    country: 'United States',
    language: 'English',
    publisherType: 'Wire Service',
    officialStatus: false,
    knownReliability: 96,
    transparency: 95,
    updateFrequency: 'Real-time',
    verificationMethod: 'Journalistic Audit'
  },
  {
    name: 'BBC News',
    domain: 'bbc.com',
    category: 'International News',
    country: 'United Kingdom',
    language: 'English',
    publisherType: 'Public Broadcaster',
    officialStatus: false,
    knownReliability: 94,
    transparency: 92,
    updateFrequency: 'Real-time',
    verificationMethod: 'Journalistic Audit'
  },
  {
    name: 'Press Information Bureau (PIB)',
    domain: 'pib.gov.in',
    category: 'Government',
    country: 'India',
    language: 'Multilingual',
    publisherType: 'Government Press Office',
    officialStatus: true,
    knownReliability: 98,
    transparency: 90,
    updateFrequency: 'Daily',
    verificationMethod: 'Official Release'
  },
  {
    name: 'Alt News',
    domain: 'altnews.in',
    category: 'Fact Check Organization',
    country: 'India',
    language: 'English/Hindi',
    publisherType: 'Non-profit fact checker',
    officialStatus: false,
    knownReliability: 95,
    transparency: 95,
    updateFrequency: 'Daily',
    verificationMethod: 'Forensic Fact-check'
  },
  {
    name: 'Boom Live',
    domain: 'boomlive.in',
    category: 'Fact Check Organization',
    country: 'India',
    language: 'English/Hindi',
    publisherType: 'Commercial fact checker',
    officialStatus: false,
    knownReliability: 95,
    transparency: 95,
    updateFrequency: 'Daily',
    verificationMethod: 'Forensic Fact-check'
  },
  {
    name: 'World Health Organization (WHO)',
    domain: 'who.int',
    category: 'Official Organization',
    country: 'Global',
    language: 'Multilingual',
    publisherType: 'International Body',
    officialStatus: true,
    knownReliability: 98,
    transparency: 90,
    updateFrequency: 'Daily',
    verificationMethod: 'Scientific Consensus'
  },
  {
    name: 'NASA',
    domain: 'nasa.gov',
    category: 'Government',
    country: 'United States',
    language: 'English',
    publisherType: 'Space Agency',
    officialStatus: true,
    knownReliability: 99,
    transparency: 95,
    updateFrequency: 'Daily',
    verificationMethod: 'Scientific Consensus'
  },
  {
    name: 'Wikipedia',
    domain: 'wikipedia.org',
    category: 'Knowledge Base',
    country: 'Global',
    language: 'Multilingual',
    publisherType: 'Crowdsourced Wiki',
    officialStatus: false,
    knownReliability: 82,
    transparency: 98,
    updateFrequency: 'Real-time',
    verificationMethod: 'Public Peer Review'
  }
];

/**
 * Normalizes URL to retrieve the primary domain name
 */
const getDomainName = (url = '') => {
  if (!url || typeof url !== 'string') return '';
  try {
    let clean = url.trim().toLowerCase();
    if (!clean.startsWith('http')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    // Remove 'www.' prefix
    return parsed.hostname.replace(/^www\./, '');
  } catch (err) {
    return '';
  }
};

/**
 * Searches the Source Trust Registry for domain metadata
 * @param {string} sourceUrl - Raw URL or domain
 * @param {string} fallbackName - Fallback name
 * @returns {Promise<Object>} STR Metadata
 */
const lookupSource = async (sourceUrl = '', fallbackName = '') => {
  const domain = getDomainName(sourceUrl);
  if (!domain) {
    return {
      name: fallbackName || 'Unknown Source',
      domain: 'unknown',
      category: 'Unknown Source',
      officialStatus: false,
      knownReliability: 45,
      transparency: 40,
      verificationMethod: 'Rule-based Fallback'
    };
  }

  try {
    // 1. Check database
    let sourceRecord = await SourceRegistry.findOne({ domain });
    if (sourceRecord) {
      return sourceRecord.toObject();
    }

    // 2. Check initial seeds
    const seed = INITIAL_SEEDS.find(s => s.domain === domain || domain.endsWith('.' + s.domain));
    if (seed) {
      let existingSeedRecord = await SourceRegistry.findOne({ domain: seed.domain });
      if (existingSeedRecord) {
        return existingSeedRecord.toObject();
      }
      
      try {
        sourceRecord = await SourceRegistry.create(seed);
        return sourceRecord.toObject();
      } catch (dbErr) {
        if (dbErr.code === 11000) {
          existingSeedRecord = await SourceRegistry.findOne({ domain: seed.domain });
          if (existingSeedRecord) return existingSeedRecord.toObject();
        }
        throw dbErr;
      }
    }

    // 3. Fallback: Dynamic generation with signals
    const isGov = domain.endsWith('.gov') || domain.endsWith('.gov.in') || domain.endsWith('.nic.in') || domain.endsWith('.int');
    const isEdu = domain.endsWith('.edu') || domain.endsWith('.ac.in');
    
    const TRUSTED_DOMAINS = [
      'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'afp.com',
      'ndtv.com', 'thehindu.com', 'indianexpress.com', 'timesofindia.indiatimes.com',
      'indiatoday.in', 'pib.gov.in', 'pib.nic.in', 'wikipedia.org', 'nasa.gov',
      'isro.gov.in', 'who.int', 'cdc.gov', 'nih.gov', 'altnews.in', 'boomlive.in',
      'factcheck.org', 'politifact.com', 'snopes.com', 'altnews.org'
    ];
    const isTrustedMedia = TRUSTED_DOMAINS.some(trusted => domain === trusted || domain.endsWith('.' + trusted));

    let category = 'Unknown Source';
    let officialStatus = false;
    let reliability = 50;
    let transparency = 50;

    if (isGov) {
      category = 'Government';
      officialStatus = true;
      reliability = 95;
      transparency = 85;
    } else if (isTrustedMedia) {
      category = 'National News';
      officialStatus = false;
      reliability = 92;
      transparency = 90;
    } else if (isEdu) {
      category = 'Academic';
      officialStatus = true;
      reliability = 90;
      transparency = 80;
    } else if (sourceUrl.startsWith('https')) {
      // Small premium for HTTPS setup
      reliability = 55;
    }

    const newSource = {
      name: fallbackName || domain.split('.')[0].toUpperCase(),
      domain,
      category,
      country: domain.endsWith('.in') ? 'India' : 'Global',
      language: 'English',
      publisherType: isGov ? 'Government Authority' : 'Digital Platform',
      officialStatus,
      knownReliability: reliability,
      transparency,
      updateFrequency: 'Irregular',
      verificationMethod: 'Dynamic Signal Assessment'
    };

    try {
      sourceRecord = await SourceRegistry.create(newSource);
      return sourceRecord.toObject();
    } catch (createErr) {
      if (createErr.code === 11000) {
        const dup = await SourceRegistry.findOne({ domain });
        if (dup) return dup.toObject();
      }
      throw createErr;
    }
  } catch (err) {
    console.warn(`STR Registry lookup failed for [${domain}]: ${err.message}. Using dynamic fallback.`);
    return {
      name: fallbackName || domain.split('.')[0].toUpperCase(),
      domain,
      category: domain.endsWith('.gov') ? 'Government' : 'Unknown Source',
      officialStatus: domain.endsWith('.gov'),
      knownReliability: domain.endsWith('.gov') ? 95 : 50,
      transparency: 50,
      verificationMethod: 'Fault-tolerant Dynamic Fallback'
    };
  }
};

module.exports = {
  lookupSource,
  getDomainName
};
