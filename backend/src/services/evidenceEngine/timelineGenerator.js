/**
 * Step 13: Evidence Timeline Generator
 * Prepares the visual timeline nodes representing processing milestones
 */

const generateTimeline = (inputType, claimsCount, evidenceCount, trustScore, verdict) => {
  return [
    {
      step: 'Input Ingestion',
      description: `Raw input received via type: [${inputType}]. Text cleaned and formatting normalized.`,
      status: 'completed'
    },
    {
      step: 'Claim Decomposition',
      description: `LLM parsed raw text and decomposed it into [${claimsCount}] self-contained factual claims.`,
      status: 'completed'
    },
    {
      step: 'Evidence Collection',
      description: `Queried news outlets, fact-check tools, and Wikipedia. Gathered [${evidenceCount}] source references.`,
      status: 'completed'
    },
    {
      step: 'Consensus Evaluation',
      description: `Calculated supporting vs. contradicting counts. Aggregated overall agreement.`,
      status: 'completed'
    },
    {
      step: 'Source Ranking',
      description: `Evaluated domain metadata, publisher reputation, and citation freshness scores.`,
      status: 'completed'
    },
    {
      step: 'Trust Score & Verdict',
      description: `Compiled weighted score of [${trustScore}%] and resolved final verdict: [${verdict}].`,
      status: 'completed'
    }
  ];
};

module.exports = {
  generateTimeline
};
