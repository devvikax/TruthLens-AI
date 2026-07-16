const aiConfig = require('../config/aiConfig');

const rateLimitStore = new Map();
const WINDOW_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Express Middleware to restrict abuse of expensive AI resources
 */
const rateLimiter = (req, res, next) => {
  const isAuth = !!req.user;
  const userKey = isAuth ? req.user.id : req.ip;
  const limit = isAuth ? aiConfig.rateLimits.userLimit : aiConfig.rateLimits.guestLimit;

  const now = Date.now();
  const record = rateLimitStore.get(userKey);

  if (!record) {
    // Fresh window entry
    rateLimitStore.set(userKey, {
      count: 1,
      windowStart: now
    });
    return next();
  }

  const timeElapsed = now - record.windowStart;

  if (timeElapsed > WINDOW_DURATION_MS) {
    // Window expired, reset tracker
    record.count = 1;
    record.windowStart = now;
    return next();
  }

  if (record.count >= limit) {
    const minutesLeft = Math.ceil((WINDOW_DURATION_MS - timeElapsed) / (60 * 1000));
    return res.status(429).json({
      success: false,
      message: `Verification rate limit exceeded. ${
        isAuth 
          ? 'Authenticated accounts are restricted to 60 audits per hour.' 
          : 'Guests are restricted to 5 audits per hour. Please sign in to increase your limit.'
      } Try again in ${minutesLeft} minutes.`
    });
  }

  // Increment query count
  record.count++;
  next();
};

module.exports = {
  rateLimiter
};
