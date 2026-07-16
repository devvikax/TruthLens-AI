const express = require('express');
const router = express.Router();
const { createSession, sendMessage } = require('../controllers/chatController');
const { optionalProtect } = require('../middleware/authMiddleware');

// Chat routes
router.post('/sessions', optionalProtect, createSession);
router.post('/sessions/:sessionId/messages', optionalProtect, sendMessage);

module.exports = router;
