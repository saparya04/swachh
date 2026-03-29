const Redis = require('ioredis');

let redis = null;
let redisUnavailable = false;

async function getClient() {
  if (redisUnavailable) return null;
  if (redis) return redis;
  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      enableOfflineQueue: false,
    });
    redis.on('error', () => {
      try {
        redis.disconnect();
      } catch { /* */ }
      redis = null;
      redisUnavailable = true;
    });
    await redis.connect();
    return redis;
  } catch {
    redisUnavailable = true;
    redis = null;
    return null;
  }
}

async function rateLimitGeo(key, maxPerWindow, windowSec) {
  const r = await getClient();
  if (!r) return true;
  try {
    const n = await r.incr(key);
    if (n === 1) await r.expire(key, windowSec);
    return n <= maxPerWindow;
  } catch {
    return true;
  }
}

module.exports = { rateLimitGeo };
