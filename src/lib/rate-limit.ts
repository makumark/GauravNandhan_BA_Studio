import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Enterprise Global Rate Limiter via Upstash Redis
 */

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Use a sliding window to prevent traffic bursts around window resets
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/ba-studio',
});

// Fallback in-memory cache in case Redis is completely unreachable (e.g. invalid keys)
const cache = new Map<string, { count: number, resetAt: number }>();

export async function rateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): Promise<{ success: boolean, remaining: number, reset: number }> {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { success, limit: _, remaining, reset } = await ratelimit.limit(identifier);
      return { success, remaining, reset };
    }
  } catch (error) {
    console.error("Redis Rate Limit Error:", error);
  }

  // Fallback to in-memory if Redis is not configured or fails
  const now = Date.now();
  const record = cache.get(identifier);

  if (!record || now > record.resetAt) {
    const newRecord = { count: 1, resetAt: now + windowMs };
    cache.set(identifier, newRecord);
    return { success: true, remaining: limit - 1, reset: newRecord.resetAt };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.resetAt };
  }

  record.count++;
  return { success: true, remaining: limit - record.count, reset: record.resetAt };
}
