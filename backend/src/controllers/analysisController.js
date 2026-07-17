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
const { runEvidenceEngine } = require('../services/evidenceEngine');

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
    let inputType = 'text';

    // If link, scrape it first
    if (input.startsWith('http')) {
      sourceUrl = input;
      const isVideoLink = /youtube\.com|youtu\.be|instagram\.com\/reel|facebook\.com\/watch|twitter\.com\/.*\/status|x\.com\/.*\/status/i.test(input);
      if (isVideoLink) {
        inputType = 'video';
        const { processVideoInput } = require('../services/videoService');
        rawInputText = await processVideoInput('url', input);
        title = `Video Link: ${input.substring(0, 40)}...`;
      } else {
        inputType = 'url';
        const scraped = await scrapeUrl(input);
        rawInputText = scraped.body || scraped.title;
        title = scraped.title;
      }
    } else {
      title = input.length > 40 ? input.substring(0, 40) + '...' : input;
    }

    // Call the modular Evidence Intelligence Engine
    const dossier = await runEvidenceEngine(inputType, rawInputText);

    const analysis = new Analysis({
      userId: req.user ? req.user._id : undefined,
      title: title || dossier.title,
      rawInput: dossier.rawInput,
      inputType: dossier.inputType,
      sourceUrl,
      metrics: dossier.metrics,
      decomposedClaims: dossier.decomposedClaims,
      entities: dossier.entities,
      evidenceCollected: dossier.evidenceCollected,
      diversityProfile: dossier.diversityProfile,
      contradictionReport: dossier.contradictionReport,
      timeline: dossier.timeline,
      badges: dossier.badges,
      sentimentAnalysis: {
        dominantEmotion: dossier.entities.quotes && dossier.entities.quotes.length > 0 ? 'Urgent' : 'Objective',
        sensationalismDetected: dossier.metrics.emotionScore < 60,
        explanation: 'Audited using Evidence Intelligence Engine.'
      },
      explainableNarrative: dossier.explainableNarrative,
      metadata: dossier.metadata
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
    if (error.requiresClarification) {
      return res.status(409).json({
        success: false,
        requiresClarification: true,
        subject: error.subject,
        candidates: error.candidates,
        message: "Multiple entity matches found. Clarification is required."
      });
    }
    next(error);
  }
};

// @desc    Perform complete hybrid analysis with OCR/PDF/Scrapers
// @route   POST /api/v1/analysis/deep
// @access  Optional Authenticated (Guests supported)
const deepAnalysis = async (req, res, next) => {
  let fileRelativePath = '';
  try {
    const { input, mockType, mockFileName } = req.body;
    let rawTextPayload = input || '';
    let title = 'Deep Analysis Search';
    let sourceUrl = '';
    let inputType = 'text';

    // 1. Mock file interception for Demo Mode
    if (mockType) {
      inputType = mockType;
      rawTextPayload = input || '';
      title = mockType === 'pdf' 
        ? `Document: ${mockFileName || 'nasa_research_report.pdf'}` 
        : `Screenshot OCR: ${mockFileName || 'whatsapp_forward_os_rumor.png'}`;
    } else if (req.file) {
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
      } else if (req.file.mimetype.startsWith('video/')) {
        inputType = 'video';
        const { processVideoInput } = require('../services/videoService');
        rawTextPayload = await processVideoInput('file', req.file.originalname);
        title = `Video Upload: ${req.file.originalname}`;
      } else {
        inputType = 'image';
        rawTextPayload = await extractTextFromImage(absoluteFilePath);
        title = `Screenshot OCR: ${req.file.originalname}`;
      }
    } else if (input && input.startsWith('http')) {
      sourceUrl = input;
      const isVideoLink = /youtube\.com|youtu\.be|instagram\.com\/reel|facebook\.com\/watch|twitter\.com\/.*\/status|x\.com\/.*\/status/i.test(input);
      if (isVideoLink) {
        inputType = 'video';
        const { processVideoInput } = require('../services/videoService');
        rawTextPayload = await processVideoInput('url', input);
        title = `Video Link: ${input.substring(0, 40)}...`;
      } else {
        inputType = 'url';
        const scraped = await scrapeUrl(input);
        rawTextPayload = scraped.body || scraped.title;
        title = scraped.title;
      }
    } else {
      title = input && input.length > 50 ? input.substring(0, 50) + '...' : 'Text Check';
    }

    if (!rawTextPayload.trim()) {
      res.status(400);
      throw new Error('Failed to parse or scrape text content from the input source.');
    }

    // Call the modular Evidence Intelligence Engine coordinator
    const dossier = await runEvidenceEngine(inputType, rawTextPayload);

    const analysis = new Analysis({
      userId: req.user ? req.user._id : undefined,
      title: title || dossier.title,
      rawInput: dossier.rawInput,
      inputType: dossier.inputType,
      sourceUrl,
      metrics: dossier.metrics,
      decomposedClaims: dossier.decomposedClaims,
      entities: dossier.entities,
      evidenceCollected: dossier.evidenceCollected,
      diversityProfile: dossier.diversityProfile,
      contradictionReport: dossier.contradictionReport,
      timeline: dossier.timeline,
      badges: dossier.badges,
      sentimentAnalysis: {
        dominantEmotion: dossier.entities.quotes && dossier.entities.quotes.length > 0 ? 'Urgent' : 'Objective',
        sensationalismDetected: dossier.metrics.emotionScore < 60,
        explanation: 'Audited using Evidence Intelligence Engine.'
      },
      explainableNarrative: dossier.explainableNarrative,
      metadata: dossier.metadata
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
    // Clean local upload file if exists
    if (fileRelativePath) {
      cleanTempFile(fileRelativePath);
    }
    
    if (error.requiresClarification) {
      return res.status(409).json({
        success: false,
        requiresClarification: true,
        subject: error.subject,
        candidates: error.candidates,
        message: "Multiple entity matches found. Clarification is required."
      });
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

const { buildRagContext } = require('../services/evidenceEngine/ragContextBuilder');
const { orchestrateAiTask } = require('../services/aiOrchestrator');

// @desc    Rewrite explanation narrative in specified persona style
// @route   POST /api/v1/analysis/:id/explain-like
// @access  Public
const explainLike = async (req, res, next) => {
  const { id } = req.params;
  const { style } = req.body;

  try {
    if (!style) {
      res.status(400);
      throw new Error('Please specify an explainability persona style.');
    }

    const analysis = await Analysis.findById(id);
    if (!analysis) {
      res.status(404);
      throw new Error('Analysis dossier not found.');
    }

    // Compile dynamic context
    const ragContext = buildRagContext({
      claims: analysis.decomposedClaims,
      evidenceList: analysis.evidenceCollected,
      verdict: analysis.verdict || 'Unverified',
      confidenceDetails: analysis.confidenceDetails,
      conflictResolution: {
        conflictDetected: analysis.contradictionReport ? analysis.contradictionReport.conflictsDetected : false,
        viewpoints: analysis.contradictionReport ? analysis.contradictionReport.summary : 'Consensus',
        recommendation: analysis.contradictionReport ? analysis.contradictionReport.recommendation : 'N/A'
      },
      diversityProfile: analysis.diversityProfile
    });

    const prompt = `
      You are an expert media literacy assistant. Grounding yourself strictly in the provided Verification Dossier Context, rewrite the explanation of this fact-check session.
      
      The explanation must be rewritten in the style of a: "${style.toUpperCase()}".
      
      Style Guides:
      - CHILD: Use very simple language, relatable analogies (like a game or playground), no complex words, and explain it like a story to an 8-year old.
      - STUDENT: Explain it clearly like a science project or class lesson, focusing on how we gathered clues and analyzed them.
      - GENERAL PUBLIC: Clear, simple, and direct. Standard style for reading news.
      - RESEARCHER: Detailed, analytical, objective, and scholarly. Reference metrics like Trust DNA, confidence percentage, and data coverage.
      - JOURNALIST: Write in news headline style with a lead sentence, summarizing the investigation, and advising caution.
      - DEVELOPER: Format it like a technical diagnostic log or code review audit. Use terms like nodes, latency, inputs, parsing, validation, and exceptions.

      CRITICAL Hallucination Safeguard:
      - Do NOT invent any new sources, citations, or facts.
      - Use ONLY the facts present in the Verification Dossier Context.
      
      Verification Dossier Context:
      ${ragContext}

      Write two independent paragraphs.
      Paragraph 1: English explanation in the requested style.
      Paragraph 2: Hindi translation of the explanation in simple Devnagari script matching the requested style.

      Output format:
      ===ENGLISH===
      [Your English text here]
      ===HINDI===
      [Your Hindi text here]
    `;

    const responseText = await orchestrateAiTask('explainableNarrative', prompt, false);
    const parts = responseText.split('===HINDI===');
    const englishPart = parts[0].replace('===ENGLISH===', '').trim();
    const hindiPart = parts[1] ? parts[1].trim() : englishPart;

    res.status(200).json({
      success: true,
      explanation: {
        en: englishPart,
        hi: hindiPart
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
  explainLike,
};
