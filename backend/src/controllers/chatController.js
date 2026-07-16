const ChatSession = require('../models/ChatSession');
const Analysis = require('../models/Analysis');
const { chatContextualResponse } = require('../services/geminiService');

// @desc    Initialize a new Chat session linked to an analysis
// @route   POST /api/v1/chat/sessions
// @access  Optional Authenticated (Guests supported)
const createSession = async (req, res, next) => {
  try {
    const { analysisId } = req.body;
    if (!analysisId) {
      res.status(400);
      throw new Error('Please provide an analysis ID');
    }

    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      res.status(404);
      throw new Error('Associated analysis report not found in database');
    }

    // Default welcome prompt based on language preference or content
    const welcomeText = analysis.explainableNarrative.hi && analysis.explainableNarrative.en.includes('Hindi')
      ? 'नमस्ते! मैं आपका मीडिया साक्षरता सहायक हूँ। इस विश्लेषण को समझने में मैं आपकी क्या मदद कर सकता हूँ?'
      : 'Hello! I am your Media Literacy Assistant. How can I help you understand this analysis?';

    const session = await ChatSession.create({
      userId: req.user ? req.user._id : undefined,
      analysisId,
      messages: [
        {
          sender: 'bot',
          text: welcomeText,
        },
      ],
    });

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message to an active chat session and get context-grounded response
// @route   POST /api/v1/chat/sessions/:sessionId/messages
// @access  Optional Authenticated
const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { sessionId } = req.params;

    if (!text) {
      res.status(400);
      throw new Error('Please enter message text');
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      res.status(404);
      throw new Error('Chat session not found');
    }

    const analysis = await Analysis.findById(session.analysisId);
    if (!analysis) {
      res.status(404);
      throw new Error('Associated analysis report not found');
    }

    // 1. Get grounded AI response
    const botText = await chatContextualResponse(analysis, session.messages, text);

    // 2. Append user message
    session.messages.push({
      sender: 'user',
      text,
    });

    // 3. Append bot response
    session.messages.push({
      sender: 'bot',
      text: botText,
    });

    await session.save();

    res.status(200).json({
      success: true,
      messages: session.messages,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  sendMessage,
};
