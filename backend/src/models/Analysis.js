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
      enum: ['text', 'url', 'image', 'pdf'],
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
    extractedClaims: [
      {
        claim: { type: String, required: true },
        verdict: { type: String, required: true },
        checkedBy: { type: String, required: true },
        url: { type: String, default: '' },
      },
    ],
    sentimentAnalysis: {
      dominantEmotion: { type: String, default: 'Objective' },
      sensationalismDetected: { type: Boolean, default: false },
      explanation: { type: String, default: '' },
    },
    explainableNarrative: {
      en: { type: String, required: true },
      hi: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization when loading history logs
AnalysisSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', AnalysisSchema);
