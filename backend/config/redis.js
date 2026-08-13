const Redis = require('ioredis');

let redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Let the provided scheme dictate TLS
const isRediss = redisUrl.startsWith('rediss://');

// Initialize Redis client
const redis = new Redis(redisUrl, {
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: (times) => (times > 3 ? null : times * 200),
  tls: isRediss ? { rejectUnauthorized: false } : undefined,
});

redis.on('connect', () => console.log('✅ Connected to Redis'));
redis.on('error', (err) => console.warn('⚠️  Redis unavailable, running without cache:', err.message));
redis.connect().catch(() => {});

/**
 * Gets cached JSON data from Redis
 * @param {string} key 
 * @returns {Promise<object|null>}
 */
async function getCache(key) {
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null; // If Redis fails, act as cache miss
  }
}

/**
 * Saves JSON data to Redis with a TTL (expiration time in seconds)
 * @param {string} key 
 * @param {object} data 
 * @param {number} ttlSeconds 
 */
async function setCache(key, data, ttlSeconds = 3600) {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch {
    // If Redis fails, ignore writing
  }
}

module.exports = { redis, getCache, setCache };
