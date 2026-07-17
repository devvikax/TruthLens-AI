const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const chatRoutes = require('./routes/chatRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Middleware Imports
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Base Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security & Optimization Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows static assets loading across origins
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000", "https://*"],
      connectSrc: [
        "'self'", 
        "https://factchecktools.googleapis.com", 
        "https://generativelanguage.googleapis.com",
        "http://localhost:5000"
      ]
    }
  }
}));
app.use(cookieParser());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Uploaded Files Static Directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Apply General Rate Limiter to API Prefix
app.use('/api/v1', apiLimiter);

// REST Routers Mapping (Auth and Users routes disabled/removed)
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/users', userRoutes);
app.use('/api/v1/analysis', analysisRoutes);
app.use('/api/v1/chat', chatRoutes);

// Telemetry & Health Check Router
app.use('/api/v1/health', healthRoutes);

// Root path handler redirecting to health check
app.get('/', (req, res) => {
  res.redirect('/api/v1/health');
});

// Error boundaries
app.use(notFound);
app.use(errorHandler);

module.exports = app;
