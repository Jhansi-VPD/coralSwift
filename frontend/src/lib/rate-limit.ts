import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Using in-memory fallback.');
    return null;
  }

  const redis = new Redis({ url, token });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(LOGIN_LIMIT, '15 m'),
    analytics: false,
    prefix: 'coralswift:ratelimit',
  });

  return ratelimit;
}

// In-memory fallback when Redis is unavailable
const memoryStore = new Map<string, number[]>();

function memoryCheck(ip: string): RateLimitResult {
  const now = Date.now();
  const timestamps = (memoryStore.get(ip) || []).filter(t => now - t < LOGIN_WINDOW_MS);
  memoryStore.set(ip, timestamps);

  if (timestamps.length >= LOGIN_LIMIT) {
    const oldest = timestamps[0];
    const reset = oldest + LOGIN_WINDOW_MS;
    return { success: false, limit: LOGIN_LIMIT, remaining: 0, reset };
  }

  timestamps.push(now);
  memoryStore.set(ip, timestamps);
  return { success: true, limit: LOGIN_LIMIT, remaining: LOGIN_LIMIT - timestamps.length, reset: 0 };
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  const rl = getRatelimit();

  if (!rl) {
    return memoryCheck(ip);
  }

  try {
    const result = await rl.limit(ip);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (err) {
    console.error('[rate-limit] Redis error, using in-memory fallback:', err);
    return memoryCheck(ip);
  }
}

export async function resetLoginRateLimit(ip: string): Promise<void> {
  memoryStore.delete(ip);

  const rl = getRatelimit();
  if (!rl) return;

  try {
    await rl.resetUsedTokens(ip);
  } catch (err) {
    console.error('[rate-limit] Redis reset error:', err);
  }
}
