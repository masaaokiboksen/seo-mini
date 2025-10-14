// src/lib/rate-limit.ts
type Hit = { count: number; windowStart: number };

const store = new Map<string, Hit>();

/** Fixed-window rate limiter.
 *  limit = max requests per windowMs for a given key (e.g., IP).
 */
export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const hit = store.get(key);

  // new window
  if (!hit || now - hit.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
  }

  // same window
  if (hit.count >= limit) {
    const resetInMs = windowMs - (now - hit.windowStart);
    return { allowed: false, remaining: 0, resetInMs };
  }

  hit.count += 1;
  return {
    allowed: true,
    remaining: limit - hit.count,
    resetInMs: windowMs - (now - hit.windowStart),
  };
}
