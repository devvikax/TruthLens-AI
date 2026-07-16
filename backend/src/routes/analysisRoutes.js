const express = require('express');
const router = express.Router();
const {
  quickAnalysis,
  deepAnalysis,
  getHistory,
  deleteHistory,
  bookmarkAnalysis,
  getBookmarks,
  uploadFile,
  explainLike,
} = require('../controllers/analysisController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const upload = require('../utils/fileUpload');
const { rateLimiter } = require('../middleware/rateLimitMiddleware');

// Analysis pipeline routes
router.post('/quick', optionalProtect, rateLimiter, quickAnalysis);
router.post('/deep', optionalProtect, upload.single('file'), rateLimiter, deepAnalysis);
router.post('/:id/explain-like', rateLimiter, explainLike);

// Standalone uploader testing route
router.post('/uploads', upload.single('file'), uploadFile);

// Historical logs & Bookmarks (strictly protected)
router.get('/history', protect, getHistory);
router.delete('/history/:id', protect, deleteHistory);
router.post('/bookmark/:id', protect, bookmarkAnalysis);
router.get('/bookmarks', protect, getBookmarks);

module.exports = router;
