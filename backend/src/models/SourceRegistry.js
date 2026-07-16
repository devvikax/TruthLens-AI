const mongoose = require('mongoose');

const SourceRegistrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Source name is required'],
      trim: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Government',
        'Official Organization',
        'International News',
        'National News',
        'Regional News',
        'Fact Check Organization',
        'Academic',
        'Research',
        'University',
        'Knowledge Base',
        'Independent Blog',
        'Unknown Source'
      ],
      default: 'Unknown Source',
    },
    country: {
      type: String,
      default: 'Global',
    },
    language: {
      type: String,
      default: 'English',
    },
    publisherType: {
      type: String,
      default: 'Digital Media',
    },
    officialStatus: {
      type: Boolean,
      default: false,
    },
    knownReliability: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    transparency: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    factCheckHistory: {
      type: Number,
      default: 0, // Number of flags/debunks
    },
    updateFrequency: {
      type: String,
      default: 'Irregular',
    },
    verificationMethod: {
      type: String,
      default: 'Automated Crawl',
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SourceRegistry', SourceRegistrySchema);
