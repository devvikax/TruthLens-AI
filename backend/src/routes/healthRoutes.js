const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getMetricsSummary } = require('../services/observability');
const { isOpenRouterConfigured, getGeminiClient } = require('../services/geminiService');

/**
 * GET /api/v1/health
 * Evaluates backend service availability, database status, and AI metrics
 */
router.get('/', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = 'disconnected';
  if (dbState === 1) dbStatus = 'connected';
  if (dbState === 2) dbStatus = 'connecting';

  const metrics = getMetricsSummary();

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStatus === 'connected' ? 'OK' : 'FAIL',
        details: dbStatus
      },
      openrouter: {
        status: isOpenRouterConfigured() ? 'OK' : 'FAIL',
        model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash:free'
      },
      geminiDirectSDK: {
        status: getGeminiClient() ? 'OK' : 'OFFLINE'
      }
    },
    performance: {
      totalRequestsTracked: metrics.totalRequests,
      successRate: metrics.successRate || 'N/A',
      averageLatencyMs: metrics.averageLatencyMs || 0,
      totalRetries: metrics.totalRetries || 0,
      recentQueries: metrics.recentLogs || []
    }
  };

  const isHealthy = healthData.services.database.status === 'OK' && 
                    (healthData.services.openrouter.status === 'OK' || healthData.services.geminiDirectSDK.status === 'OK');

  if (!isHealthy) {
    healthData.status = 'degraded';
    return res.status(200).json(healthData); // return degraded status gracefully
  }

  res.status(200).json(healthData);
});

module.exports = router;
