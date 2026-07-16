const { validationResult } = require('express-validator');

/**
 * Validates request schema parameters, returning 400 Bad Request if validation rules fail
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map(err => err.msg).join(', ')
    });
  }
  next();
};

module.exports = { validateRequest };
