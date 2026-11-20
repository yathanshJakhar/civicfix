const fails = new Map<string, { count: number; reset: number }>();
const LIMIT = 5;
const WINDOW_MS = 60_000;

export function isBlocked(key: string): boolean {
  const f = fails.get(key);
  return !!f && f.reset > Date.now() && f.count >= LIMIT;
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const f = fails.get(key);
  if (!f || f.reset <= now) fails.set(key, { count: 1, reset: now + WINDOW_MS });
  else f.count += 1;
}

export function clearFailures(key: string): void {
  fails.delete(key);
}