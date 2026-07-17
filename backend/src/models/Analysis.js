const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Nullable to fully support Guest Mode
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Analysis title is required'],
      trim: true,
    },
    rawInput: {
      type: String,
      required: [true, 'Raw input text is required'],
    },
    inputType: {
      type: String,
      enum: ['text', 'url', 'image', 'pdf', 'video'],
      required: true,
    },
    sourceUrl: {
      type: String,
      default: '',
    },
    metrics: {
      trustScore: { type: Number, required: true, min: 0, max: 100 },
      sourceReputation: { type: Number, required: true, min: 0, max: 100 },
      biasScore: { type: Number, required: true, min: 0, max: 100 },
      claimVerification: { type: Number, required: true, min: 0, max: 100 },
      emotionScore: { type: Number, required: true, min: 0, max: 100 },
    },
    // Backwards compatible field
    extractedClaims: [
      {
        claim: { type: String, required: true },
        verdict: { type: String, required: true },
        checkedBy: { type: String, required: true },
        url: { type: String, default: '' },
      },
    ],
    // Expanded claim decomposer dossiers
    decomposedClaims: [
      {
        id: { type: String },
        originalSentence: { type: String },
        normalizedSentence: { type: String },
        priority: { type: String },
        confidence: { type: Number },
        supportingCount: { type: Number, default: 0 },
        contradictingCount: { type: Number, default: 0 },
        independentCount: { type: Number, default: 0 },
        officialCount: { type: Number, default: 0 },
        evidenceStrength: { type: Number, default: 0 },
        agreementPercent: { type: Number, default: 0 }
      }
    ],
    // Categorized entity markers
    entities: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Scored and whitelisted media references
    evidenceCollected: [
      {
        title: { type: String },
        snippet: { type: String },
        url: { type: String },
        source: { type: String },
        category: { type: String },
        reliabilityScore: { type: Number },
        isOfficial: { type: Boolean },
        isTrusted: { type: Boolean },
        stance: { type: String },
        explanation: { type: String },
        primarySource: {
          isOriginal: { type: Boolean },
          originalReporter: { type: String },
          deduplicationKey: { type: String },
          relation: { type: String },
          explanation: { type: String }
        }
      }
    ],
    diversityProfile: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    contradictionReport: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timeline: [
      {
        step: { type: String },
        description: { type: String },
        status: { type: String }
      }
    ],
    badges: [
      {
        text: { type: String },
        type: { type: String }
      }
    ],
    evidenceGraph: {
      type: mongoose.Schema.Types.Mixed,
      default: { nodes: [], links: [] }
    },
    confidenceDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    sentimentAnalysis: {
      dominantEmotion: { type: String, default: 'Objective' },
      sensationalismDetected: { type: Boolean, default: false },
      explanation: { type: String, default: '' },
    },
    explainableNarrative: {
      en: { type: String, required: true },
      hi: { type: String, required: true },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization when loading history logs
AnalysisSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', AnalysisSchema);
