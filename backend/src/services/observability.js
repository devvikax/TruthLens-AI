/**
 * Observability & Telemetry Service
 * Monitors processing durations, LLM latency, cache efficiency, and error classes.
 */

const metricsLog = [];

const logTelemetry = (data) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    task: data.task || 'unknown',
    provider: data.provider || 'unknown',
    latencyMs: data.latencyMs || 0,
    status: data.status || 'success',
    retryCount: data.retryCount || 0,
    errorClass: data.errorClass || null,
    tokensEstimated: data.tokensEstimated || 0
  };

  metricsLog.push(logEntry);
  
  // Clean logs if array becomes extremely large (cap at 500)
  if (metricsLog.length > 500) {
    metricsLog.shift();
  }

  console.log(`[Telemetry] Task: ${logEntry.task} | Provider: ${logEntry.provider} | Latency: ${logEntry.latencyMs}ms | Status: ${logEntry.status} | Retries: ${logEntry.retryCount}`);
};

const getMetricsSummary = () => {
  const total = metricsLog.length;
  if (total === 0) return { totalRequests: 0, averageLatencyMs: 0, errorRate: 0 };

  const successCount = metricsLog.filter(m => m.status === 'success').length;
  const totalLatency = metricsLog.reduce((acc, curr) => acc + curr.latencyMs, 0);
  const totalRetries = metricsLog.reduce((acc, curr) => acc + curr.retryCount, 0);

  return {
    totalRequests: total,
    successRate: `${Math.round((successCount / total) * 100)}%`,
    averageLatencyMs: Math.round(totalLatency / total),
    totalRetries,
    recentLogs: metricsLog.slice(-5)
  };
};

module.exports = {
  logTelemetry,
  getMetricsSummary
};
