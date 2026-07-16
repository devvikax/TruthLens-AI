const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRequest } = require('../middleware/validateMiddleware');

// Input Validation helper
const validateRegister = [
  body('name', 'Name is required').notEmpty().trim(),
  body('email', 'Please enter a valid email address').isEmail().normalizeEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
];

const validateLogin = [
  body('email', 'Please enter a valid email address').isEmail().normalizeEmail(),
  body('password', 'Password is required').notEmpty(),
];

// Router routes
router.post('/register', authLimiter, validateRegister, validateRequest, register);
router.post('/login', authLimiter, validateLogin, validateRequest, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
