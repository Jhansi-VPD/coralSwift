const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// In-memory store for rate limiting
const memoryStore = new Map<string, number[]>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  const now = Date.now();
  const timestamps = (memoryStore.get(ip) || []).filter(t => now - t < LOGIN_WINDOW_MS);
  memoryStore.set(ip, timestamps);

  if (timestamps.length >= LOGIN_LIMIT) {
    const oldest = timestamps[0] || now;
    const reset = oldest + LOGIN_WINDOW_MS;
    return { success: false, limit: LOGIN_LIMIT, remaining: 0, reset };
  }

  timestamps.push(now);
  memoryStore.set(ip, timestamps);
  return { success: true, limit: LOGIN_LIMIT, remaining: LOGIN_LIMIT - timestamps.length, reset: 0 };
}

export async function resetLoginRateLimit(ip: string): Promise<void> {
  memoryStore.delete(ip);
}
