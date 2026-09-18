import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Rate limiting disabled.');
    return null;
  }

  const redis = new Redis({ url, token });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: false,
    prefix: 'coralswift:ratelimit',
  });

  return ratelimit;
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
    // Fail-open: Redis unavailable, allow request without rate limiting
    return { success: true, limit: 5, remaining: 5, reset: 0 };
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
    console.error('[rate-limit] Redis error, failing open:', err);
    return { success: true, limit: 5, remaining: 5, reset: 0 };
  }
}

export async function resetLoginRateLimit(ip: string): Promise<void> {
  const rl = getRatelimit();
  if (!rl) return;

  try {
    await rl.resetUsedTokens(ip);
  } catch (err) {
    console.error('[rate-limit] Redis reset error:', err);
  }
}
