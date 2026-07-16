/**
 * Step 5: Multi-Stage Confidence Calculator
 * Calculates individual confidence scores across 6 distinct validation gates,
 * outputting mathematical audit logs for full pipeline transparency.
 */

/**
 * Computes multi-stage confidence ratings
 * @param {Object} data - Verification metrics gathered
 * @returns {Object} Ratings object with score and component breakdowns
 */
const calculateConfidence = (data) => {
  const {
    evidenceCount = 0,
    deduplicatedCount = 0,
    averageSourceReliability = 50,
    agreementPercent = 50,
    diversityScore = 50,
    entityLinkConfidence = 0.95, // 0.0 - 1.0 from entityLinker
    claimParseConfidence = 0.95, // 0.0 - 1.0 from claimUnderstander
    averageRelevanceScore = 75   // 0 - 100 average of validated evidence
  } = data;

  // 1. Entity Confidence: mapped from the Entity Linker
  const entityConfidence = Math.round(entityLinkConfidence * 100);

  // 2. Claim Confidence: mapped from the Claim Understander
  const claimConfidence = Math.round(claimParseConfidence * 100);

  // 3. Retrieval Confidence: mapped from crawl volume and diversity
  const quantityScore = Math.min(deduplicatedCount * 25, 100);
  const retrievalConfidence = Math.round(quantityScore * 0.6 + (diversityScore || 50) * 0.4);

  // 4. Evidence Confidence: combines source reliability and relevance validator scores
  const evidenceConfidence = Math.round(averageSourceReliability * 0.5 + averageRelevanceScore * 0.5);

  // 5. Verdict Confidence: mapped from source consensus agreement percent
  const verdictConfidence = agreementPercent;

  // 6. Overall Confidence: Synthesis of all 5 stages
  // Formula: Entity * 0.15 + Claim * 0.15 + Retrieval * 0.20 + Evidence * 0.25 + Verdict * 0.25
  const overallConfidence = Math.round(
    entityConfidence * 0.15 +
    claimConfidence * 0.15 +
    retrievalConfidence * 0.20 +
    evidenceConfidence * 0.25 +
    verdictConfidence * 0.25
  );

  const score = Math.max(5, Math.min(100, overallConfidence));

  // Compile detailed mathematical transparency logs
  const logs = [];
  logs.push(`- Stage 1: Entity Confidence: ${entityConfidence}% (based on context-aware entity linking).`);
  logs.push(`- Stage 2: Claim Confidence: ${claimConfidence}% (based on semantic predicate parsing).`);
  logs.push(`- Stage 3: Retrieval Confidence: ${retrievalConfidence}% (based on query coverage and domain diversity).`);
  logs.push(`- Stage 4: Evidence Confidence: ${evidenceConfidence}% (average source reliability of ${Math.round(averageSourceReliability)}% and relevance score of ${Math.round(averageRelevanceScore)}%).`);
  logs.push(`- Stage 5: Verdict Confidence: ${verdictConfidence}% (degree of agreement/consensus among sources).`);
  logs.push(`- Stage 6: Overall Synthesized Confidence: ${score}% (Formula: Entity * 0.15 + Claim * 0.15 + Retrieval * 0.20 + Evidence * 0.25 + Verdict * 0.25).`);

  return {
    score,
    explanation: `Verification confidence resolved at ${score}% across 6 mathematical validation gates.`,
    transparencyLogs: logs,
    components: {
      entity: entityConfidence,
      claim: claimConfidence,
      retrieval: retrievalConfidence,
      evidence: evidenceConfidence,
      verdict: verdictConfidence
    }
  };
};

module.exports = {
  calculateConfidence
};
