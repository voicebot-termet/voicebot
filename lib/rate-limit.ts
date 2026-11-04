// In-memory rate limiter — resets per serverless container instance.
// Provides meaningful protection on persistent servers and some protection
// on serverless (within a single warm instance).
interface Window {
  count: number;
  windowStart: number;
}

const store = new Map<string, Window>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const existing = store.get(ip);

  if (!existing || now - existing.windowStart > WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (existing.count >= MAX_ATTEMPTS) {
    return false;
  }

  existing.count++;
  return true;
}
