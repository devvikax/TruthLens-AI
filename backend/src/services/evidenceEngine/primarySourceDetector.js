/**
 * Primary Source Detector
 * Analyzes evidence text and domain metadata to detect quoted, copied, or syndicated sources.
 * Prevents counting republished wire agency reports (e.g. Reuters, AP) as multiple independent sources.
 */

const WIRE_AGENCIES = [
  { name: 'Reuters', patterns: [/reuters/i, /according to reuters/i, /reporting by reuters/i] },
  { name: 'Associated Press', patterns: [/associated press/i, / ap /i, /according to ap/i, / ap reported/i] },
  { name: 'Agence France-Presse', patterns: [/afp/i, /agence france-presse/i] },
  { name: 'Press Trust of India', patterns: [/pti/i, /press trust of india/i] },
  { name: 'PIB Fact Check', patterns: [/pib/i, /pib fact check/i] }
];

/**
 * Inspects a snippet and domain to resolve original vs copied reporting details
 * @param {string} snippet - The raw text excerpt
 * @param {string} sourceName - The publisher name (e.g. "BlogSpot", "NDTV")
 * @returns {Object} Primary source details
 */
const detectPrimarySource = (snippet = '', sourceName = '') => {
  if (typeof snippet !== 'string') {
    return {
      isOriginal: true,
      originalReporter: sourceName,
      deduplicationKey: `src_${sourceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    };
  }

  // Check if snippet references any wire agency
  for (const agency of WIRE_AGENCIES) {
    const isQuoting = agency.patterns.some(regex => regex.test(snippet));
    const isTheAgencyItself = sourceName.toLowerCase().includes(agency.name.toLowerCase()) || 
                              (agency.name === 'Associated Press' && sourceName.toLowerCase() === 'ap');

    if (isQuoting && !isTheAgencyItself) {
      return {
        isOriginal: false,
        originalReporter: agency.name,
        deduplicationKey: `wire_${agency.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        relation: 'quoted_syndication',
        explanation: `Publisher [${sourceName}] republished or quoted wire service [${agency.name}] findings.`
      };
    }
  }

  // Default: original reporting from this specific domain
  return {
    isOriginal: true,
    originalReporter: sourceName,
    deduplicationKey: `src_${sourceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    relation: 'original_reporting',
    explanation: `Source [${sourceName}] represents original reporting.`
  };
};

module.exports = {
  detectPrimarySource
};
