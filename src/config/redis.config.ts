import Redis from 'ioredis';

let hasLoggedRedisError = false;

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  lazyConnect: true,
  connectTimeout: 1000,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy: () => null,
});

redis.on('connect', () => {
  hasLoggedRedisError = false;
  console.log('✅ Redis connected');
});
redis.on('error', (err) => {
  if (!hasLoggedRedisError) {
    hasLoggedRedisError = true;
    console.error('❌ Redis unavailable, fraud checks will fail open:', err.message);
  }
});

export function isRedisReady() {
  return redis.status === 'ready';
}

export default redis;
