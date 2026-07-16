const { orchestrateAiTask } = require('../aiOrchestrator');

/**
 * Step 3: Custom Search Query Generator
 * Generates category-specific bidirectional search queries targeting optimal sources
 * @param {Object} claimMetadata - Analyzed metadata of the claim
 * @returns {Promise<Object>} Object containing distinct query fields
 */
const generateQueries = async (claimMetadata) => {
  const { normalizedClaim, subject, event, claimType } = claimMetadata;

  const prompt = `
    You are an expert investigative journalist verifying a viral claim.
    Normalized Claim: "${normalizedClaim}"
    Subject Entity: "${subject}"
    Event: "${event}"
    Claim Type: "${claimType}"

    Generate 6 distinct, category-specific search queries. The queries must target the optimal sources for this specific category:
    - If "Death / Celebrity Death": Target obituaries, family statements, hospital bulletins, and official news agencies.
    - If "Health / Medical": Target peer-reviewed research, WHO guidelines, FDA, and medical journals.
    - If "Government Announcement": Target official government gazettes, PIB, and official ministry portals.
    - If "Election / Politics": Target Election Commission statements, registered candidate disclosures, and verified polling organizations.
    - If "Space" / "Science": Target agency publications (NASA, ISRO, ESA) and science journals.
    - If "Financial Scam" / "Investment": Target regulatory alerts (RBI, SEBI, SEC) and scam watch advisories.
    - If "Disaster": Target emergency management alerts (FEMA, NDMA) and local weather bulletins.

    Respond strictly with a JSON object in this format:
    {
      "officialVerification": "Category-optimized query for official verification (e.g. WHO/NASA/BCCI/PIB official press releases)",
      "factCheck": "Query targeting Snopes, PIB Fact Check, or Reuters fact checks",
      "positiveEvidence": "Query assuming the claim is true to find original supporting publications",
      "negativeEvidence": "Query checking for denials, obituaries, alive updates, or scam reports",
      "latestNews": "Query seeking latest news bulletins or press conferences",
      "entitySpecific": "Query targeting the subject's official social handles or statement archives"
    }
  `;

  try {
    const responseText = await orchestrateAiTask('claimDecomposition', prompt, true);
    return JSON.parse(responseText);
  } catch (err) {
    console.warn(`Query generation failed: ${err.message}. Returning fallback query set.`);
    return getFallbackQueries(claimMetadata);
  }
};

/**
 * Local fallback query generator
 */
const getFallbackQueries = (claimMetadata) => {
  const { normalizedClaim, subject, event, claimType } = claimMetadata;
  const lowerSubject = subject.toLowerCase();

  // Category specific overrides
  if (claimType === 'Death / Celebrity Death') {
    return {
      officialVerification: `${subject} family spokesperson official statement`,
      factCheck: `${subject} death rumor hoax fact check`,
      positiveEvidence: `${subject} passes away obituary news`,
      negativeEvidence: `${subject} alive health updates latest appearance`,
      latestNews: `${subject} hospital statement health condition`,
      entitySpecific: `${subject} official instagram twitter statement`
    };
  }

  if (claimType === 'Health / Medical') {
    return {
      officialVerification: `WHO guidelines CDC advisory on ${subject}`,
      factCheck: `${subject} health claim medical debunk factcheck`,
      positiveEvidence: `${subject} peer reviewed study journal pubmed`,
      negativeEvidence: `${subject} health risks side effects warnings`,
      latestNews: `${subject} medical association latest research`,
      entitySpecific: `World Health Organization publication search on ${subject}`
    };
  }

  if (claimType === 'Government Announcement') {
    return {
      officialVerification: `PIB fact check gazette notification for ${subject}`,
      factCheck: `${subject} government scheme fake yojana warning`,
      positiveEvidence: `Ministry of Finance Electronics official release ${subject}`,
      negativeEvidence: `${subject} scam notification warning`,
      latestNews: `${subject} press information bureau bulletin`,
      entitySpecific: `government portal notification archive ${subject}`
    };
  }

  if (claimType === 'Election / Politics') {
    return {
      officialVerification: `Election Commission of India official statement ${subject}`,
      factCheck: `${subject} political statement factcheck debunk`,
      positiveEvidence: `${subject} candidate affidavit results declaration`,
      negativeEvidence: `${subject} speech verification fact check`,
      latestNews: `${subject} election commission press release`,
      entitySpecific: `${subject} verified political party statement`
    };
  }

  if (claimType === 'Sports') {
    return {
      officialVerification: `BCCI FIFA official squad announcement ${subject}`,
      factCheck: `${subject} retirement transfer rumor factcheck`,
      positiveEvidence: `${subject} match results league standings`,
      negativeEvidence: `${subject} playing next match squad roster`,
      latestNews: `${subject} post match press conference interview`,
      entitySpecific: `${subject} official athlete social media handles`
    };
  }

  if (claimType === 'Space' || claimType === 'Science') {
    return {
      officialVerification: `NASA ISRO official mission press release ${subject}`,
      factCheck: `${subject} discovery alien claim debunk science check`,
      positiveEvidence: `${subject} scientific paper nature journal`,
      negativeEvidence: `${subject} space discovery debunk contradiction`,
      latestNews: `${subject} scientific findings agency bulletin`,
      entitySpecific: `ISRO NASA spacecraft tracking status ${subject}`
    };
  }

  if (claimType === 'Financial Scam' || claimType === 'Investment') {
    return {
      officialVerification: `RBI SEBI official warning list ${subject}`,
      factCheck: `${subject} free recharge laptop yojana scam check`,
      positiveEvidence: `${subject} official government scheme terms`,
      negativeEvidence: `${subject} fraud alert complaint forum`,
      latestNews: `${subject} investment caution notice regulatory`,
      entitySpecific: `Ministry of Finance official notification ${subject}`
    };
  }

  if (claimType === 'Disaster') {
    return {
      officialVerification: `NDMA FEMA emergency warning status ${subject}`,
      factCheck: `${subject} video fake cyclone flood check`,
      positiveEvidence: `${subject} official disaster rescue updates`,
      negativeEvidence: `${subject} weather forecast official warning`,
      latestNews: `${subject} emergency alert bulletin broadcast`,
      entitySpecific: `regional disaster management agency updates ${subject}`
    };
  }

  // Default General Fallback
  return {
    officialVerification: `${subject} official press release statement`,
    factCheck: `${subject} ${event} fact check snopes`,
    positiveEvidence: `${normalizedClaim} news report`,
    negativeEvidence: `${subject} ${event} fake news rumor`,
    latestNews: `${subject} latest updates news`,
    entitySpecific: `${subject} official social handles`
  };
};

module.exports = {
  generateQueries,
  getFallbackQueries
};
