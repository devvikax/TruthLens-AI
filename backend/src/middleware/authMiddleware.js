

// Protect routes - requires valid JWT (Bypassed)
const protect = async (req, res, next) => {
  return next();
};

// Optional protect - parses JWT if available, but does not block guests (Bypassed)
const optionalProtect = async (req, res, next) => {
  next();
};

module.exports = { protect, optionalProtect };
