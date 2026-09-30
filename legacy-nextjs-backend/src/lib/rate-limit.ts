/**
 * RATE LIMITING
 *
 * FIX (ISSUES_REPORT #5): the previous implementation stored counters in a
 * per-process Map, which resets on every serverless invocation — effectively
 * no limiting on Vercel. Now backed by Upstash Redis (already a dependency,
 * durable across invocations) when UPSTASH_REDIS_REST_URL/TOKEN are set,
 * falling back to the in-memory Map for local development.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW = '15 m';
const FORM_LIMIT = 10;
const FORM_WINDOW = '10 m';

// Singleton Redis + limiters
let redis: Redis | null = null;
let loginLimiter: Ratelimit | null = null;
let formLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!redis) redis = new Redis({ url, token });
  return redis;
}

function getLoginLimiter(): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  if (!loginLimiter) {
    loginLimiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(LOGIN_LIMIT, LOGIN_WINDOW),
      prefix: 'coralswift:login',
    });
  }
  return loginLimiter;
}

function getFormLimiter(): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  if (!formLimiter) {
    formLimiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(FORM_LIMIT, FORM_WINDOW),
      prefix: 'coralswift:form',
    });
  }
  return formLimiter;
}

// ---- In-memory fallback (local dev / no Upstash configured) ----
const memoryStore = new Map<string, number[]>();

function memoryWindow(key: string, limit: number, windowMs: number): { success: boolean; reset: number } {
  const now = Date.now();
  const timestamps = (memoryStore.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= limit) {
    memoryStore.set(key, timestamps);
    const oldest = timestamps[0] || now;
    return { success: false, reset: oldest + windowMs };
  }
  timestamps.push(now);
  memoryStore.set(key, timestamps);
  return { success: true, reset: 0 };
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getLoginLimiter();
  if (limiter) {
    const result = await limiter.limit(ip);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }
  const mem = memoryWindow(`login:${ip}`, LOGIN_LIMIT, 15 * 60 * 1000);
  return { success: mem.success, limit: LOGIN_LIMIT, remaining: 0, reset: mem.reset };
}

/**
 * Public form abuse protection (enquiries + applications).
 * Generous limit: a human filling forms won't hit 10 per 10 minutes.
 */
export async function checkFormRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getFormLimiter();
  if (limiter) {
    const result = await limiter.limit(ip);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }
  const mem = memoryWindow(`form:${ip}`, FORM_LIMIT, 10 * 60 * 1000);
  return { success: mem.success, limit: FORM_LIMIT, remaining: 0, reset: mem.reset };
}

export async function resetLoginRateLimit(ip: string): Promise<void> {
  const limiter = getLoginLimiter();
  if (limiter) {
    // Ratelimit has no direct reset; setting a fresh block is the practical reset
    const r = getRedis();
    if (r) await r.del(`coralswift:login:${ip}`).catch(() => undefined);
    return;
  }
  memoryStore.delete(`login:${ip}`);
}
