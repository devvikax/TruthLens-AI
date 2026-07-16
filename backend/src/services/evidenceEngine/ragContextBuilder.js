/**
 * RAG Context Builder
 * Compiles a structured markdown context payload summarizing the entire verification dossier.
 * This structured context represents the SOLE allowed source of knowledge for the LLM explainer.
 */

const buildRagContext = (data) => {
  const {
    claims = [],
    evidenceList = [],
    verdict = '',
    confidenceDetails = {},
    conflictResolution = {},
    diversityProfile = {}
  } = data;

  let ctx = `=== Retained Verification Dossier Context ===\n\n`;

  ctx += `Resolved Verdict: ${verdict}\n`;
  ctx += `Calculated Confidence Score: ${confidenceDetails.score}%\n`;
  ctx += `Confidence Explanation: ${confidenceDetails.explanation}\n\n`;

  ctx += `--- Extracted Claims ---\n`;
  claims.forEach((c, idx) => {
    ctx += `[Claim ${idx + 1}] (${c.id})\n`;
    ctx += `- Original Text: "${c.originalSentence}"\n`;
    ctx += `- Normalized Text: "${c.normalizedSentence}"\n`;
    ctx += `- Priority: ${c.priority}\n`;
    ctx += `- Agreement consensus: ${c.agreementPercent}%\n\n`;
  });

  ctx += `--- Verified Evidence Pool (Ranked) ---\n`;
  if (evidenceList.length === 0) {
    ctx += `No verified matching evidence records found in the directories.\n\n`;
  } else {
    evidenceList.forEach((ev, idx) => {
      ctx += `[Evidence #${idx + 1}] Title: "${ev.title}"\n`;
      ctx += `- Source Domain: ${ev.source} (Category: ${ev.category})\n`;
      ctx += `- Reliability Score: ${ev.reliabilityScore}%\n`;
      ctx += `- Original Reporting: ${ev.primarySource && ev.primarySource.isOriginal ? 'Yes' : 'No'}\n`;
      ctx += `- URL Link: ${ev.url}\n`;
      ctx += `- Excerpt: "${ev.snippet}"\n`;
      ctx += `- Freshness score: ${ev.freshnessScore || 50}% (Date: ${ev.date || 'unknown'})\n\n`;
    });
  }

  ctx += `--- Diversity & Conflict Matrix ---\n`;
  ctx += `- Diversity Rating: ${diversityProfile.diversityScore}%\n`;
  ctx += `- Disagreement detected: ${conflictResolution.conflictDetected ? 'Yes' : 'No'}\n`;
  ctx += `- Viewpoints details: ${conflictResolution.viewpoints || 'Consensus'}\n`;
  ctx += `- Auditor Action Recommendation: ${conflictResolution.recommendation || 'N/A'}\n\n`;

  ctx += `==============================================\n`;

  return ctx;
};

module.exports = {
  buildRagContext
};
