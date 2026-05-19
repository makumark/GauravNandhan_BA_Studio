/**
 * Simple In-Memory Rate Limiter
 */

const cache = new Map<string, { count: number, resetAt: number }>();

export function rateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): { success: boolean, remaining: number, reset: number } {
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
