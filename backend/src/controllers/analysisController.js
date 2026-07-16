const path = require('path');
const fs = require('fs');

// Model Imports
const Analysis = require('../models/Analysis');
const UploadedFile = require('../models/UploadedFile');
const Bookmark = require('../models/Bookmark');

// Service Imports
const { scrapeUrl } = require('../services/scraperService');
const { extractTextFromImage } = require('../services/ocrService');
const { extractTextFromPdf } = require('../services/pdfService');
const { searchFactChecks } = require('../services/searchService');
const { analyzeText, generateNarrative } = require('../services/geminiService');
const { uploadToCloudinary } = require('../services/cloudinaryService');

// Utility Imports
const { calculateTrustScore } = require('../utils/trustCalculator');

// Helper to clean uploaded file from local filesystem after processing
const cleanTempFile = (filePath) => {
  try {
    const fullPath = path.join(__dirname, '../../', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.warn(`Failed to delete temporary upload: ${err.message}`);
  }
};

// @desc    Perform quick lightweight analysis
// @route   POST /api/v1/analysis/quick
// @access  Optional Authenticated (Guests supported)
const quickAnalysis = async (req, res, next) => {
  try {
    const { input } = req.body;
    if (!input) {
      res.status(400);
      throw new Error('Please provide text or link input');
    }

    let rawInputText = input;
    let title = 'Quick Inspection';
    let sourceUrl = '';

    // If link, scrape it first
    if (input.startsWith('http')) {
      sourceUrl = input;
      const scraped = await scrapeUrl(input);
      rawInputText = scraped.body || scraped.title;
      title = scraped.title;
    } else {
      title = input.length > 40 ? input.substring(0, 40) + '...' : input;
    }

    // 1. Run Gemini NLP analysis (Entities, Claims, Sentiment, Bias, Source reputation)
    const nlpMetrics = await analyzeText(rawInputText);

    // 2. Cross-reference first claim against Fact-Checking registries
    let factCheckCitations = [];
    if (nlpMetrics.claims && nlpMetrics.claims.length > 0) {
      factCheckCitations = await searchFactChecks(nlpMetrics.claims[0]);
    }

    // 3. Setup Weighted Metrics
    let claimsScore = nlpMetrics.claimVerification || 60;
    if (factCheckCitations.length > 0) {
      // Adjust claim score dynamically if factcheck verdicts are found
      const match = factCheckCitations[0].verdict.toLowerCase();
      if (match.includes('false') || match.includes('debunked') || match.includes('misleading') || match.includes('गलत')) {
        claimsScore = 10;
      } else if (match.includes('true') || match.includes('credible') || match.includes('सही')) {
        claimsScore = 95;
      } else {
        claimsScore = 45;
      }
    }

    const metrics = {
      sourceReputation: nlpMetrics.source ? nlpMetrics.source.score : 80,
      biasScore: nlpMetrics.bias ? nlpMetrics.bias.score : 80,
      claimVerification: claimsScore,
      emotionScore: nlpMetrics.emotions ? nlpMetrics.emotions.score : 80,
    };

    // 4. Calculate weighted Trust Score
    const { trustScore, verdict } = calculateTrustScore(metrics);

    // 5. Generate bilingual explainable AI summaries
    const explainableNarrative = await generateNarrative({
      metrics: { ...metrics, trustScore },
      extractedClaims: factCheckCitations,
      verdict
    });

    const analysis = new Analysis({
      userId: req.user ? req.user._id : undefined,
      title,
      rawInput: rawInputText.substring(0, 1000), // restrict length inside DB log
      inputType: sourceUrl ? 'url' : 'text',
      sourceUrl,
      metrics: {
        trustScore,
        ...metrics
      },
      extractedClaims: factCheckCitations,
      sentimentAnalysis: {
        dominantEmotion: nlpMetrics.emotions ? nlpMetrics.emotions.triggers.join(', ') : 'Objective',
        sensationalismDetected: nlpMetrics.emotions ? nlpMetrics.emotions.score < 60 : false,
        explanation: nlpMetrics.emotions ? nlpMetrics.emotions.explanation : ''
      },
      explainableNarrative
    });

    // Save to database only if user is logged in
    if (req.user) {
      await analysis.save();
    }

    res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Perform complete hybrid analysis with OCR/PDF/Scrapers
// @route   POST /api/v1/analysis/deep
// @access  Optional Authenticated (Guests supported)
const deepAnalysis = async (req, res, next) => {
  let fileRelativePath = '';
  try {
    const { input } = req.body;
    let rawTextPayload = input || '';
    let title = 'Deep Analysis Search';
    let sourceUrl = '';
    let inputType = 'text';

    // 1. File text extraction pipeline
    if (req.file) {
      fileRelativePath = `/uploads/${req.file.filename}`;
      const absoluteFilePath = path.join(__dirname, '../../uploads', req.file.filename);

      // Try uploading to Cloudinary
      let filePathToSave = fileRelativePath;
      const cloudinaryUrl = await uploadToCloudinary(absoluteFilePath);
      if (cloudinaryUrl) {
        filePathToSave = cloudinaryUrl;
      }

      // Log upload entry
      await UploadedFile.create({
        userId: req.user ? req.user._id : undefined,
        fileName: req.file.originalname,
        secureName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        filePath: filePathToSave
      });

      if (req.file.mimetype.includes('pdf')) {
        inputType = 'pdf';
        rawTextPayload = await extractTextFromPdf(absoluteFilePath);
        title = `Document: ${req.file.originalname}`;
      } else {
        inputType = 'image';
        rawTextPayload = await extractTextFromImage(absoluteFilePath);
        title = `Screenshot OCR: ${req.file.originalname}`;
      }
    } else if (input && input.startsWith('http')) {
      inputType = 'url';
      sourceUrl = input;
      const scraped = await scrapeUrl(input);
      rawTextPayload = scraped.body || scraped.title;
      title = scraped.title;
    } else {
      title = input && input.length > 50 ? input.substring(0, 50) + '...' : 'Text Check';
    }

    if (!rawTextPayload.trim()) {
      res.status(400);
      throw new Error('Failed to parse or scrape text content from the input source.');
    }

    // 2. Gemini semantic parsing
    const nlpMetrics = await analyzeText(rawTextPayload);

    // 3. Search and cross-reference first 2 extracted claims in parallel
    let factCheckCitations = [];
    if (nlpMetrics.claims && nlpMetrics.claims.length > 0) {
      const searchPromises = nlpMetrics.claims.slice(0, 2).map(claim => searchFactChecks(claim));
      const searchResults = await Promise.all(searchPromises);
      // Flatten arrays and filter null values
      factCheckCitations = searchResults.flat().filter(cite => cite !== undefined);
    }

    // 4. Setup scoring metrics
    let claimsScore = nlpMetrics.claimVerification || 60;
    if (factCheckCitations.length > 0) {
      const verdicts = factCheckCitations.map(c => c.verdict.toLowerCase());
      const hasFalse = verdicts.some(v => v.includes('false') || v.includes('debunked') || v.includes('misleading') || v.includes('गलत'));
      const hasTrue = verdicts.every(v => v.includes('true') || v.includes('credible') || v.includes('सही'));

      if (hasFalse) claimsScore = 12;
      else if (hasTrue) claimsScore = 94;
      else claimsScore = 48;
    }

    const metrics = {
      sourceReputation: nlpMetrics.source ? nlpMetrics.source.score : 80,
      biasScore: nlpMetrics.bias ? nlpMetrics.bias.score : 80,
      claimVerification: claimsScore,
      emotionScore: nlpMetrics.emotions ? nlpMetrics.emotions.score : 80,
    };

    // 5. Calculate final weighted trust score
    const { trustScore, verdict } = calculateTrustScore(metrics);

    // 6. Generate bilingual summaries
    const explainableNarrative = await generateNarrative({
      metrics: { ...metrics, trustScore },
      extractedClaims: factCheckCitations,
      verdict
    });

    const analysis = new Analysis({
      userId: req.user ? req.user._id : undefined,
      title,
      rawInput: rawTextPayload.substring(0, 1500),
      inputType,
      sourceUrl,
      metrics: {
        trustScore,
        ...metrics
      },
      extractedClaims: factCheckCitations,
      sentimentAnalysis: {
        dominantEmotion: nlpMetrics.emotions ? nlpMetrics.emotions.triggers.join(', ') : 'Objective',
        sensationalismDetected: nlpMetrics.emotions ? nlpMetrics.emotions.score < 60 : false,
        explanation: nlpMetrics.emotions ? nlpMetrics.emotions.explanation : ''
      },
      explainableNarrative
    });

    if (req.user) {
      await analysis.save();
    }

    // Clean local file if uploader ran successfully to free filesystem space in sandbox
    if (fileRelativePath) {
      cleanTempFile(fileRelativePath);
    }

    res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    // Make sure we delete local uploads in case of failures
    if (fileRelativePath) {
      cleanTempFile(fileRelativePath);
    }
    next(error);
  }
};

// @desc    Get user's analysis history
// @route   GET /api/v1/analysis/history
// @access  Private
const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const count = await Analysis.countDocuments({ userId: req.user._id });
    const history = await Analysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      page,
      pages: Math.ceil(count / limit),
      count,
      history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete item from user's history
// @route   DELETE /api/v1/analysis/history/:id
// @access  Private
const deleteHistory = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!analysis) {
      res.status(404);
      throw new Error('Verification record not found or unauthorized');
    }

    await Bookmark.deleteMany({ userId: req.user._id, analysisId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Verification record deleted from history log',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bookmark or remove bookmark from analysis
// @route   POST /api/v1/analysis/bookmark/:id
// @access  Private
const bookmarkAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) {
      res.status(404);
      throw new Error('Analysis report not found');
    }

    const bookmarked = await Bookmark.findOne({
      userId: req.user._id,
      analysisId: req.params.id
    });

    if (bookmarked) {
      await bookmarked.deleteOne();
      res.status(200).json({ success: true, isBookmarked: false, message: 'Bookmark removed' });
    } else {
      await Bookmark.create({
        userId: req.user._id,
        analysisId: req.params.id
      });
      res.status(200).json({ success: true, isBookmarked: true, message: 'Bookmark added' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's bookmarked analyses
// @route   GET /api/v1/analysis/bookmarks
// @access  Private
const getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user._id })
      .populate('analysisId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookmarks: bookmarks.map(b => b.analysisId).filter(a => a !== null),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test Standalone uploader
// @route   POST /api/v1/analysis/uploads
// @access  Public
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file received');
    }

    const fileRelativePath = `/uploads/${req.file.filename}`;
    const absoluteFilePath = path.join(__dirname, '../../uploads', req.file.filename);
    let filePathToSave = fileRelativePath;

    // Try uploading to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(absoluteFilePath);
    if (cloudinaryUrl) {
      filePathToSave = cloudinaryUrl;
      // Clean temp file since it is hosted on Cloudinary
      try {
        fs.unlinkSync(absoluteFilePath);
      } catch (err) {
        console.warn(`Failed to delete temporary hosted upload: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      file: {
        fileName: req.file.originalname,
        secureName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        filePath: filePathToSave
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  quickAnalysis,
  deepAnalysis,
  getHistory,
  deleteHistory,
  bookmarkAnalysis,
  getBookmarks,
  uploadFile,
};
