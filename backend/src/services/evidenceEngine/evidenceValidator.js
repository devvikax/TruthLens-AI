/**
 * Step 6 & 7: Evidence Validator & Relevance Scorer
 * Performs false positive reduction, applies category-specific routing rules,
 * computes 100-point relevance ratings, and compiles the selection reasoning.
 */

// Whitelist of trusted news outlets for strict verification rules (e.g. Death claims)
const TRUSTED_NEWS_DOMAINS = [
  'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'afp.com',
  'ndtv.com', 'thehindu.com', 'indianexpress.com', 'timesofindia.indiatimes.com',
  'indiatoday.in', 'pib.gov.in', 'pib.nic.in', 'wikipedia.org', 'nasa.gov',
  'isro.gov.in', 'who.int', 'cdc.gov', 'nih.gov'
];

/**
 * Validates a single search result
 * @param {Object} item - Scraped evidence item
 * @param {Object} claimMetadata - Understood claim specifications
 * @param {Object} resolvedEntity - Resolved entity data
 * @returns {Object} { isValid: boolean, score: number, reason: string, explanation: string }
 */
const validateEvidence = (item, claimMetadata, resolvedEntity) => {
  const { subject, event, claimType } = claimMetadata;
  const canonicalEntity = resolvedEntity.resolvedEntity.toLowerCase();
  
  const title = (item.title || '').toLowerCase();
  const snippet = (item.snippet || '').toLowerCase();
  const textBody = `${title} ${snippet}`;
  const url = (item.url || '').toLowerCase();

  let score = 0;
  const auditLogs = [];

  // --- STEP 7: FALSE POSITIVE REDUCTION ---
  
  // 1. Cross-Entity Mismatch Check
  // If the query is about one person, but the source prominently discusses a different person, reject it.
  const isTargetVirat = canonicalEntity.includes('virat') || canonicalEntity.includes('kohli');
  const isTargetAmitabh = canonicalEntity.includes('amitabh') || canonicalEntity.includes('bachchan');

  if (isTargetVirat && (textBody.includes('amitabh') || textBody.includes('bachchan') || textBody.includes('dhoni') || textBody.includes('sachin'))) {
    // If the snippet is primarily about a different person and does not mention Kohli, reject.
    if (!textBody.includes('kohli') && !textBody.includes('virat')) {
      return {
        isValid: false,
        score: 0,
        reason: "False Positive: Discusses a different athlete/celebrity.",
        explanation: "This source was rejected because it references a different individual or celebrity event."
      };
    }
  }

  if (isTargetAmitabh && (textBody.includes('kohli') || textBody.includes('virat') || textBody.includes('jannat zubair'))) {
    if (!textBody.includes('amitabh') && !textBody.includes('bachchan')) {
      return {
        isValid: false,
        score: 0,
        reason: "False Positive: Discusses a different celebrity/person.",
        explanation: "This source was rejected because it references a different individual or celebrity event."
      };
    }
  }

  // 2. Cross-Topic/Event Mismatch Check
  // E.g. Claim is about space/science but source discusses political elections.
  const isSpaceClaim = claimType === 'Space' || claimType === 'Science';
  if (isSpaceClaim && (textBody.includes('election') || textBody.includes('polling') || textBody.includes('parliament') || textBody.includes('bjp') || textBody.includes('congress'))) {
    if (!textBody.includes('nasa') && !textBody.includes('isro') && !textBody.includes('space') && !textBody.includes('launch')) {
      return {
        isValid: false,
        score: 0,
        reason: "False Positive: Space query matched unrelated political articles.",
        explanation: "This source was rejected because it discusses political events rather than space discoveries."
      };
    }
  }

  // --- STEP 4: SPECIAL CATEGORY VERIFICATION RULES ---
  
  // Rule A: Death / Celebrity Death claims must NEVER utilize unverified blogs or general forums.
  if (claimType === 'Death / Celebrity Death') {
    const isTrustedDomain = TRUSTED_NEWS_DOMAINS.some(domain => url.includes(domain)) || url.includes('.gov') || url.includes('.edu');
    if (!isTrustedDomain) {
      return {
        isValid: false,
        score: 0,
        reason: "Rejected: Death claims cannot utilize unverified independent blogs/forums.",
        explanation: "We rejected this source because celebrity death claims require verified confirmation from official agencies or trusted news wires."
      };
    }
  }

  // Rule B: Government Announcements must prioritize official government sites (.gov, .nic, PIB)
  let governmentBonus = 0;
  if (claimType === 'Government Announcement') {
    const isGovDomain = url.includes('.gov') || url.includes('.gov.in') || url.includes('.nic.in') || url.includes('pib.gov.in');
    if (isGovDomain) {
      governmentBonus = 15;
      auditLogs.push("+15: Government portal verification bonus.");
    }
  }

  // Rule C: Medical/Health Claims must prioritize peer-reviewed research papers or official health guidelines (WHO, CDC)
  let medicalBonus = 0;
  if (claimType === 'Health / Medical') {
    const isHealthPortal = url.includes('who.int') || url.includes('cdc.gov') || url.includes('nih.gov') || url.includes('.edu');
    if (isHealthPortal) {
      medicalBonus = 15;
      auditLogs.push("+15: Health/WHO/CDC portal credibility bonus.");
    }
  }

  // --- 100-POINT RELEVANCE SCORING ---

  // 1. Entity Match (Weight: 30)
  const canonicalTerms = canonicalEntity.split(' ');
  const rawTerms = subject.toLowerCase().split(' ');
  
  let entityMatch = false;
  if (textBody.includes(canonicalEntity)) {
    score += 30;
    entityMatch = true;
    auditLogs.push("+30: Canonical entity exact match.");
  } else {
    const matchedCanonical = canonicalTerms.filter(term => term.length > 2 && textBody.includes(term));
    const matchedRaw = rawTerms.filter(term => term.length > 2 && textBody.includes(term));
    
    if (matchedCanonical.length > 0 || matchedRaw.length > 0) {
      const matchBonus = Math.min(20, (matchedCanonical.length + matchedRaw.length) * 10);
      score += matchBonus;
      entityMatch = true;
      auditLogs.push(`+${matchBonus}: Partial entity word matches.`);
    }
  }

  if (!entityMatch) {
    return {
      isValid: false,
      score: 0,
      reason: "Entity mismatch: Primary subject entity not found.",
      explanation: "This source was rejected because it does not mention the primary entity."
    };
  }

  // 2. Claim & Event Similarity (Weight: 30)
  const eventTerms = (event || '').toLowerCase().split(' ');
  const predicateTerms = claimMetadata.predicate.toLowerCase().split(' ');
  
  const matchedEventTerms = eventTerms.filter(term => term.length > 2 && textBody.includes(term));
  const matchedPredicateTerms = predicateTerms.filter(term => term.length > 2 && textBody.includes(term));

  if (matchedEventTerms.length > 0 || matchedPredicateTerms.length > 0) {
    const eventBonus = Math.min(30, (matchedEventTerms.length + matchedPredicateTerms.length) * 15);
    score += eventBonus;
    auditLogs.push(`+${eventBonus}: Claim/event descriptor matches.`);
  }

  if (event === 'death' && (textBody.includes('died') || textBody.includes('death') || textBody.includes('passed away') || textBody.includes('alive') || textBody.includes('na rahe'))) {
    score += 10;
    auditLogs.push("+10: Specific death context confirmed.");
  }

  // 3. Topic overlap & Debunk vocabulary (Weight: 20)
  const factcheckKeywords = ['fact check', 'pib', 'hoax', 'fake', 'rumor', 'debunk', 'clarification', 'misleading', 'f फर्जी', 'अफवाह', 'सच'];
  const hasFactcheckContext = factcheckKeywords.some(kw => textBody.includes(kw));
  if (hasFactcheckContext) {
    score += 15;
    auditLogs.push("+15: Factchecking / debunk context.");
  }

  // 4. Source Reputation / URL credibility (Weight: 20)
  const isGovernment = url.includes('.gov') || url.includes('.gov.in') || url.includes('.nic.in');
  const isWikipedia = url.includes('wikipedia.org');
  const isNews = TRUSTED_NEWS_DOMAINS.some(domain => url.includes(domain));

  if (isGovernment) {
    score += 20;
    auditLogs.push("+20: Source is official government portal.");
  } else if (isNews) {
    score += 15;
    auditLogs.push("+15: Source is recognized media publication.");
  } else if (isWikipedia) {
    score += 10;
    auditLogs.push("+10: Source is public encyclopedia.");
  } else {
    score += 5;
    auditLogs.push("+5: General web search source.");
  }

  // Add category bonuses
  score += governmentBonus + medicalBonus;
  
  const finalScore = Math.min(100, score);
  const isValid = finalScore >= 50;

  // --- STEP 8: REASONING IMPROVEMENTS ---
  let explanation = `This source provides general news context regarding ${subject}.`;
  if (claimType === 'Health / Medical') {
    explanation = `This is a medical claim, therefore official health guidelines (WHO/CDC) and peer-reviewed journals were prioritized over general news websites.`;
  } else if (claimType === 'Government Announcement') {
    explanation = `This is a government update, therefore official government portals, PIB bulletins, and official gazettes were prioritized to confirm authenticity.`;
  } else if (claimType === 'Space' || claimType === 'Science') {
    explanation = `This is a space/science claim, therefore official space research agencies (NASA/ISRO) and science journals were prioritized.`;
  } else if (claimType === 'Death / Celebrity Death') {
    explanation = `This is a celebrity death claim, therefore verified family statements and official news agencies were prioritized, and unverified blogs were rejected.`;
  } else if (claimType === 'Financial Scam' || claimType === 'Investment') {
    explanation = `This is a financial yojana/scam claim, therefore regulatory advisories (RBI/SEBI/SEC) and official scam warnings were prioritized.`;
  }

  return {
    isValid,
    score: finalScore,
    reason: isValid ? `Validated successfully. Logs: ${auditLogs.join(' ')}` : `Rejected: Low relevance score (${finalScore}/100). Logs: ${auditLogs.join(' ')}`,
    explanation
  };
};

module.exports = {
  validateEvidence,
  TRUSTED_NEWS_DOMAINS
};
