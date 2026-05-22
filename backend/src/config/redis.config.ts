import { Redis as IORedis } from 'ioredis';

// ioredis v5 exports Redis as a named export.
// We use `as any` at the constructor call to remain resilient
// across different build environments and their module resolution strategies.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RedisConstructor = IORedis as any;

let hasLoggedRedisError = false;

const redis: IORedis = new RedisConstructor({
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
redis.on('error', (err: Error) => {
  if (!hasLoggedRedisError) {
    hasLoggedRedisError = true;
    console.error('❌ Redis unavailable, fraud checks will fail open:', err.message);
  }
});

void redis.connect().catch(() => {
  /* connection errors are logged via the "error" event */
});

export function isRedisReady() {
  return redis.status === 'ready';
}

export default redis;
