// Load environment variables
require('dotenv').config();

// Override local router DNS for SRV queries
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('DNS override failed:', e.message);
}

const app = require('../src/app');
const connectDB = require('../src/config/db');

// Connect to MongoDB
connectDB();

// Export the request handler for Vercel Serverless Functions
module.exports = app;
