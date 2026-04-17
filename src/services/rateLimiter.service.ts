import redis, { isRedisReady } from '../config/redis.config.js';

const slidingWindowLua = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local clearBefore = now - window
redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
local count = redis.call('ZCARD', key)
if count >= limit then
  return redis.call('ZCARD', key)
end
redis.call('ZADD', key, now, tostring(now) .. math.random())
redis.call('EXPIRE', key, math.ceil(window/1000))
return 0
`;

export async function checkRateLimit(params: {
  identifier: string;
  windowMs: number;
  limit: number;
}): Promise<{
  allowed: boolean;
  count: number;
  remaining: number;
  resetAt: number;
}> {
  if (!isRedisReady()) {
    throw new Error('Redis unavailable for rate limiting');
  }

  const now = Date.now();
  const result = await redis.eval(
    slidingWindowLua, 1,
    params.identifier,
    now.toString(),
    params.windowMs.toString(),
    params.limit.toString()
  ) as number;

  const allowed = result === 0;
  const count = allowed ? 0 : result;
  return {
    allowed,
    count,
    remaining: Math.max(0, params.limit - count),
    resetAt: now + params.windowMs,
  };
}
