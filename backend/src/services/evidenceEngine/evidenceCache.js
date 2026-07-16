const crypto = require('crypto');

// In-memory cache map
const cacheStore = new Map();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const getHash = (text = '') => {
  const clean = text.trim().toLowerCase();
  return crypto.createHash('md5').update(clean).digest('hex');
};

/**
 * Retreives cached dossier if hit and fresh
 * @param {string} rawInput - Cleaned input payload
 * @returns {Object|null} Cached dossier or null
 */
const getCache = (rawInput = '') => {
  const hash = getHash(rawInput);
  const entry = cacheStore.get(hash);

  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    // Evict stale cache entry
    cacheStore.delete(hash);
    console.log(`- Evicted stale cache record [Hash: ${hash}].`);
    return null;
  }

  console.log(`- Cache HIT detected [Hash: ${hash}]. Reusing dossier.`);
  return entry.dossier;
};

/**
 * Saves dossier to cache
 * @param {string} rawInput - Cleaned input payload
 * @param {Object} dossier - Calculated verification dossier
 */
const setCache = (rawInput = '', dossier) => {
  if (!rawInput || !dossier) return;
  const hash = getHash(rawInput);
  
  cacheStore.set(hash, {
    timestamp: Date.now(),
    dossier
  });
  console.log(`- Cached verification dossier [Hash: ${hash}].`);
};

const clearCache = () => {
  cacheStore.clear();
};

module.exports = {
  getCache,
  setCache,
  clearCache
};
