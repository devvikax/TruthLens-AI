const { cleanText, validateInput } = require('./inputProcessor');
const { lookupSource } = require('./sourceRegistryService');
const { detectPrimarySource } = require('./primarySourceDetector');
const { calculateSourceDiversity } = require('./diversityEngine');
const { calculateConsensus } = require('./consensusEngine');
const { detectManipulation } = require('./manipulationDetector');
const { calculateWeightedTrustScore } = require('./trustEngine');
const { resolveVerdict } = require('./verdictEngine');
const { generateTimeline } = require('./timelineGenerator');
const { generateBadges } = require('./badgeGenerator');
const { generateExplanation } = require('./narrativeGenerator');
const { calculateConfidence } = require('./confidenceCalculator');
const { generateClaimGraph } = require('./graphGenerator');

const { understandClaim } = require('./claimUnderstander');
const { linkEntity } = require('./entityLinker');
const { generateQueries } = require('./queryGenerator');
const { collectBidirectionalEvidence } = require('./evidenceCollector');

const { rankEvidence } = require('./evidenceRanker');
const { resolveConflicts } = require('./conflictResolver');
const { evaluateFreshness } = require('./freshnessEngine');
const { buildRagContext } = require('./ragContextBuilder');
const { getCache, setCache } = require('./evidenceCache');
const { aiLocalStorage } = require('../aiOrchestrator');

/**
 * Inner runner for executing actual modular verification steps
 */
const executePipelineSteps = async (inputType, cleanedText, rawInput) => {
  // Step 2: Claim Understanding Engine
  const claimMetadata = await understandClaim(cleanedText);
  console.log(`- Semantic Claim Understood: "${claimMetadata.normalizedClaim}" [Category: ${claimMetadata.claimType}]`);

  // early-exit if not a verifiable factual claim
  if (!claimMetadata.isVerifiableFactualClaim) {
    console.log(`- Input is NOT a verifiable factual claim: ${claimMetadata.nonVerifiableReason}`);
    return {
      title: 'Non-Factual Input Checked',
      rawInput: cleanedText.substring(0, 5000),
      inputType,
      metrics: {
        trustScore: 50,
        sourceReputation: 0,
        biasScore: 50,
        claimVerification: 0,
        emotionScore: 100
      },
      decomposedClaims: [],
      entities: { persons: [], organizations: [], locations: [], events: [] },
      evidenceCollected: [],
      diversityProfile: { diversityScore: 0, counts: { domestic: 0, international: 0 } },
      contradictionReport: {
        conflictsDetected: false,
        summary: [],
        recommendation: "Factual verification was not performed."
      },
      timeline: [],
      badges: [],
      evidenceGraph: { nodes: [], edges: [] },
      confidenceDetails: {
        score: 0,
        explanation: "Verification confidence is 0% because the input is not a verifiable factual claim.",
        transparencyLogs: [claimMetadata.nonVerifiableReason],
        components: { entity: 0, claim: 0, retrieval: 0, evidence: 0, verdict: 0 }
      },
      explainableNarrative: {
        en: `This input cannot be verified because it is not a verifiable factual claim. ${claimMetadata.nonVerifiableReason || "Please enter an objective statement about historical, scientific, or news events."}`,
        hi: `इस इनपुट को सत्यापित नहीं किया जा सकता क्योंकि यह एक तथ्य-जांच योग्य दावा नहीं है। ${claimMetadata.nonVerifiableReason || "कृपया ऐतिहासिक, वैज्ञानिक या समाचार घटनाओं के बारे में एक वस्तुनिष्ठ कथन दर्ज करें।"}`
      },
      metadata: {
        claimCategory: "Non-Verifiable",
        categories: ["Non-Verifiable"],
        verificationStrategy: "None (Bypassed)",
        prioritizedSources: "None",
        pipelineSelected: "Bypassed (Non-Factual Input)",
        debugLogs: {
          generatedQueries: {},
          rejectedSources: [],
          claimMetadata,
          resolvedEntity: {},
          finalVerdict: "Not a Factual Claim"
        }
      }
    };
  }

  // Step 3: Entity Linking Engine
  const resolvedEntity = await linkEntity(claimMetadata.subject, claimMetadata.context);
  console.log(`- Entity Linked: [${resolvedEntity.resolvedEntity}] (Confidence: ${resolvedEntity.confidence * 100}%)`);

  // If entity resolution fails or returns requiresClarification, throw 409
  if (resolvedEntity.requiresClarification) {
    const error = new Error("Ambiguous entity requires clarification");
    error.requiresClarification = true;
    error.candidates = resolvedEntity.candidates;
    error.subject = claimMetadata.subject;
    throw error;
  }

  // Step 4: Query Intelligence Engine
  const queries = await generateQueries(claimMetadata);
  console.log(`- Bidirectional queries generated. FactCheck: "${queries.factCheck}", NegEvidence: "${queries.negativeEvidence}"`);

  // Step 5: Bidirectional Retrieval & Relevance Validation (Returns both validated & rejected lists, and sandbox telemetry)
  const { validated: validatedEvidence, rejected: rejectedEvidence, telemetry } = await collectBidirectionalEvidence(claimMetadata, resolvedEntity, queries);

  // Step 6: Source Registry Lookup & Primary Source Syndication Checks
  const scoredEvidencePromises = validatedEvidence.map(async (item) => {
    const registry = await lookupSource(item.url, item.source);
    const primarySource = detectPrimarySource(item.snippet, item.source);

    return {
      ...item,
      reliabilityScore: registry.knownReliability,
      isOfficial: registry.officialStatus,
      isTrusted: registry.knownReliability >= 70,
      primarySource
    };
  });
  const scoredEvidence = await Promise.all(scoredEvidencePromises);
  console.log(`- Retained ${scoredEvidence.length} relevant rated evidence records.`);

  // Mapping decomposed claims format for backward compatibility in RAG context builders
  const decomposedClaims = [{
    id: "claim_1",
    originalSentence: cleanedText,
    normalizedSentence: claimMetadata.normalizedClaim,
    priority: "high",
    confidence: claimMetadata.confidence || 0.95
  }];

  // Entities format for downstream
  const entities = {
    persons: resolvedEntity.entityType === 'Person' ? [resolvedEntity.resolvedEntity] : [],
    organizations: resolvedEntity.entityType === 'Organization' ? [resolvedEntity.resolvedEntity] : [],
    locations: resolvedEntity.entityType === 'Location' ? [resolvedEntity.resolvedEntity] : [],
    events: claimMetadata.event !== 'none' ? [claimMetadata.event] : []
  };

  // Step 7: Source Diversity Evaluation
  const diversityProfile = calculateSourceDiversity(scoredEvidence);

  // Step 8: Freshness Engine Analysis
  const freshnessProfile = evaluateFreshness(scoredEvidence);

  // Step 9: Conflict Resolution Engine (discrepancy detection)
  // Filter out Wikipedia from primary conflict and consensus evaluation so it is never used for news or verdict generation.
  const primaryEvidence = scoredEvidence.filter(e => !e.isWikipedia);
  const conflictResolution = await resolveConflicts(decomposedClaims, primaryEvidence);

  // Step 10: Consensus Evaluation per claim
  const claimsWithConsensus = await calculateConsensus(decomposedClaims, primaryEvidence);

  // Step 11: Manipulation & Sensationalism Detection
  const manipulationProfile = await detectManipulation(cleanedText);

  // Step 12: Weighted Trust Score Synthesis
  const averageSourceReliability = scoredEvidence.length > 0
    ? Math.round(scoredEvidence.reduce((acc, curr) => acc + curr.reliabilityScore, 0) / scoredEvidence.length)
    : 50;

  const averageEvidenceQuality = claimsWithConsensus.length > 0
    ? Math.round(claimsWithConsensus.reduce((acc, curr) => acc + curr.evidenceStrength, 0) / claimsWithConsensus.length)
    : 50;

  const averageAgreementPercent = claimsWithConsensus.length > 0
    ? Math.round(claimsWithConsensus.reduce((acc, curr) => acc + curr.agreementPercent, 0) / claimsWithConsensus.length)
    : 50;

  const averageRelevanceScore = scoredEvidence.length > 0
    ? Math.round(scoredEvidence.reduce((acc, curr) => acc + curr.relevanceScore, 0) / scoredEvidence.length)
    : 75;

  // Convert raw manipulation scores to a 0-100 control rating
  const fearVal = manipulationProfile.fearScore || 0;
  const clickbaitVal = manipulationProfile.clickbaitScore || 0;
  const urgencyVal = manipulationProfile.urgencyScore || 0;
  const emotionalityVal = manipulationProfile.emotionalityScore || 0;
  const manipulationControl = Math.round(100 - (fearVal + clickbaitVal + urgencyVal + emotionalityVal) / 4);

  // Source count calculations
  const officialCount = scoredEvidence.filter(e => e.isOfficial).length;
  const supportingCount = claimsWithConsensus.reduce((acc, curr) => acc + (curr.supportingCount || 0), 0);
  const contradictingCount = claimsWithConsensus.reduce((acc, curr) => acc + (curr.contradictingCount || 0), 0);
  const factCheckCount = scoredEvidence.filter(e => e.category.includes('Fact Check') || e.category.includes('Factcheck')).length;

  const metrics = {
    sourceReputation: averageSourceReliability,
    biasScore: manipulationProfile.politicalBias === 'none' ? 95 : 60,
    claimVerification: averageEvidenceQuality,
    emotionScore: manipulationControl,
    evidenceQuality: averageEvidenceQuality,
    sourceReliability: averageSourceReliability,
    independentSources: Math.min(scoredEvidence.filter(e => !e.isOfficial).length * 15, 100),
    officialConfirmation: officialCount > 0 ? 100 : 40,
    agreementConsensus: averageAgreementPercent,
    manipulationControl,
    contradictingCount
  };

  const trustScore = calculateWeightedTrustScore(metrics, claimMetadata.claimType);

  // Step 13: Final Verdict Resolution
  const finalVerdict = resolveVerdict({
    trustScore,
    officialConfirmCount: officialCount,
    contradictingCount,
    supportingCount,
    factCheckCount: factCheckCount,
    agreementPercent: averageAgreementPercent,
    evidenceStrength: averageEvidenceQuality,
    evidenceCount: primaryEvidence.length
  });

  // Deduplication for confidence calculations (excluding Wikipedia background context)
  const uniqueReporters = new Set(primaryEvidence.map(e => e.primarySource ? e.primarySource.deduplicationKey : e.url));
  const deduplicatedCount = uniqueReporters.size;

  // Step 14: Multi-Stage Confidence Scoring (Step 5)
  const confidenceDetails = calculateConfidence({
    evidenceCount: primaryEvidence.length,
    deduplicatedCount,
    averageSourceReliability,
    agreementPercent: averageAgreementPercent,
    diversityScore: diversityProfile.diversityScore,
    entityLinkConfidence: resolvedEntity.confidence || 0.95,
    claimParseConfidence: claimMetadata.confidence || 0.95,
    averageRelevanceScore
  });

  // Apply freshness and contradiction adjustments mathematically
  let finalConfidence = Math.max(5, Math.min(100, Math.round(
    confidenceDetails.score * freshnessProfile.freshnessMultiplier - (conflictResolution.conflictDetected ? conflictResolution.reducedConfidencePenalty : 0)
  )));
  
  confidenceDetails.score = finalConfidence;
  confidenceDetails.transparencyLogs.push(`- Freshness multiplier correction: ${freshnessProfile.freshnessMultiplier}x.`);
  if (conflictResolution.conflictDetected) {
    confidenceDetails.transparencyLogs.push(`- Contradicting source penalty deduction: -${conflictResolution.reducedConfidencePenalty} points.`);
  }

  // Step 15: Claim Adjacency Relationship Graph Compiler
  const evidenceGraph = generateClaimGraph(claimsWithConsensus, scoredEvidence, finalVerdict);

  // Step 16: Evidence Timeline Compilation
  const timeline = generateTimeline(
    inputType,
    decomposedClaims.length,
    scoredEvidence.length,
    trustScore,
    finalVerdict
  );

  // Step 17: Reliability Badges Allocation
  const badges = generateBadges({
    officialCount,
    supportingCount,
    contradictingCount,
    factCheckCount,
    internationalCount: diversityProfile.counts.international,
    verdict: finalVerdict
  });

  // Step 18: Grounded RAG Context Assembly
  const ragContext = buildRagContext({
    claims: claimsWithConsensus,
    evidenceList: scoredEvidence,
    verdict: finalVerdict,
    confidenceDetails,
    conflictResolution,
    diversityProfile
  });

  // Step 19: AI Bilingual Summary Explanation (solely grounded in RAG context)
  const explainableNarrative = await generateExplanation({
    trustScore,
    verdict: finalVerdict,
    supportingCount,
    contradictingCount,
    evidenceList: scoredEvidence.slice(0, 5),
    rejectedList: rejectedEvidence.slice(0, 5),
    ragContext // pass context to prompt builder
  });

  // Strategy & Prioritization Metadata logs (Step 9 UI Requirements)
  let strategyUsed = "Balanced General Media Verification Protocol";
  let prioritizedSources = "Fact-Check Registries, News Wires, General Search Indexes";

  const t = claimMetadata.claimType;
  if (t === 'Death / Celebrity Death') {
    strategyUsed = "Death Verification Protocol";
    prioritizedSources = "Obituaries, official family spokespersons, hospital bulletins, and trusted wires.";
  } else if (t === 'Health / Medical') {
    strategyUsed = "Medical Verification Protocol";
    prioritizedSources = "World Health Organization (WHO), CDC, medical journals, and PubMed databases.";
  } else if (t === 'Government Announcement') {
    strategyUsed = "Government Gazette Verification Protocol";
    prioritizedSources = "Press Information Bureau (PIB), government ministries, and official publications.";
  } else if (t === 'Election / Politics') {
    strategyUsed = "Electoral Integrity Protocol";
    prioritizedSources = "Election Commission press releases, candidate disclosures, and registered polls.";
  } else if (t === 'Sports') {
    strategyUsed = "Sports Registry Protocol";
    prioritizedSources = "Sports Federations (BCCI/FIFA), team rosters, and verified sports media outlets.";
  } else if (t === 'Space' || t === 'Science') {
    strategyUsed = "Scientific Verification Protocol";
    prioritizedSources = "Space agencies (NASA/ISRO/ESA) and peer-reviewed journals (Nature/Science).";
  } else if (t === 'Financial Scam' || t === 'Investment') {
    strategyUsed = "Regulatory Advisory Protocol";
    prioritizedSources = "Regulatory warnings (RBI/SEBI/SEC) and official scam alert databases.";
  } else if (t === 'Disaster') {
    strategyUsed = "Emergency Response Alert Protocol";
    prioritizedSources = "Emergency agencies (FEMA/NDMA), weather bureaus, and local first responders.";
  } else if (t === 'International Affairs') {
    strategyUsed = "Diplomatic Intelligence Protocol";
    prioritizedSources = "United Nations reports, foreign affairs publications, and global news wires.";
  }

  const dossier = {
    title: rawInput.startsWith('http') ? 'RAV Scraped Link Audit' : 'Factual Claims Forensic Dossier',
    rawInput: cleanedText.substring(0, 5000),
    inputType,
    metrics: {
      trustScore,
      sourceReputation: averageSourceReliability,
      biasScore: metrics.biasScore,
      claimVerification: averageEvidenceQuality,
      emotionScore: manipulationControl
    },
    decomposedClaims: claimsWithConsensus,
    entities,
    evidenceCollected: scoredEvidence,
    diversityProfile,
    contradictionReport: {
      conflictsDetected: conflictResolution.conflictDetected,
      summary: conflictResolution.viewpoints,
      recommendation: conflictResolution.recommendation
    },
    timeline,
    badges,
    evidenceGraph,
    confidenceDetails,
    explainableNarrative,
    
    // Step 9 & 10 UI metadata parameters
    metadata: {
      claimCategory: t,
      categories: claimMetadata.categories || [t],
      verificationStrategy: strategyUsed,
      prioritizedSources,
      pipelineSelected: "Intelligent Dynamic Claim Verification Pipeline v2",
      debugLogs: {
        generatedQueries: queries,
        rejectedSources: rejectedEvidence,
        claimMetadata,
        resolvedEntity,
        finalVerdict,
        providerUsed: telemetry ? telemetry.providerUsed : [],
        candidateUrls: telemetry ? telemetry.candidateUrls : [],
        rejectedUrls: telemetry ? telemetry.rejectedUrls : [],
        rejectedReasons: telemetry ? telemetry.rejectedReasons : [],
        extractionStatus: telemetry ? telemetry.extractionStatus : [],
        entityMatch: telemetry ? telemetry.entityMatch : [],
        claimMatch: telemetry ? telemetry.claimMatch : [],
        evidenceScore: telemetry ? telemetry.evidenceScore : [],
        trustScore: trustScore,
        finalRanking: validatedEvidence.map((e, idx) => ({ rank: idx + 1, title: e.title, url: e.url, score: e.relevanceScore }))
      }
    }
  };

  return dossier;
};

/**
 * Executes the complete modular Evidence Intelligence Engine pipeline
 * @param {string} inputType - 'text' | 'url' | 'image' | 'pdf' | 'video'
 * @param {string} rawInput - Text content or hyperlink url
 * @returns {Promise<Object>} The complete, transparent credibility dossier
 */
const runEvidenceEngine = async (inputType, rawInput) => {
  console.log(`\n=== INITIATING RAV EVIDENCE ENGINE [Type: ${inputType}] ===`);

  // Step 1: Input Processor & Sanitization
  const validation = validateInput(inputType, rawInput);
  if (!validation.isValid) {
    throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
  }
  const cleanedText = cleanText(rawInput);

  // Check Caching layer first to save API cost
  const cachedDossier = getCache(cleanedText);
  if (cachedDossier) {
    return cachedDossier;
  }

  const traces = [];
  const dossier = await aiLocalStorage.run(traces, async () => {
    return await executePipelineSteps(inputType, cleanedText, rawInput);
  });

  // Attach accumulated traces
  dossier.metadata.debugLogs.traces = traces;

  // Cache compiled dossier
  setCache(cleanedText, dossier);

  console.log(`=== RAV ENGINE AUDIT COMPLETE. Resolved: [${dossier.metadata.debugLogs.finalVerdict}] ===\n`);

  return dossier;
};

module.exports = {
  runEvidenceEngine
};
