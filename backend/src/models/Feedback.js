const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      enum: [1, -1], // 1 for thumbs up, -1 for thumbs down
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ['accuracy', 'bias', 'translation', 'technical', 'other'],
      default: 'accuracy',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need creation time
  }
);

module.exports = mongoose.model('Feedback', FeedbackSchema);
