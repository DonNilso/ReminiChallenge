export class HttpError extends Error {
  readonly status: number;
  readonly retryAfterMs?: number;
  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Rate limits, cold-start timeouts, transient upstream failures and network errors. */
export function isRetryable(err: unknown): boolean {
  if (err instanceof HttpError) return [408, 425, 429, 500, 502, 503, 504].includes(err.status);
  if (err instanceof Error) {
    return err.name === "TimeoutError" || err.name === "AbortError" || /fetch failed|ECONNRESET|ETIMEDOUT|socket/i.test(err.message);
  }
  return false;
}

export type RetryOptions = {
  retries?: number; // extra attempts after the first
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, err: unknown, delayMs: number) => void;
  sleep?: (ms: number) => Promise<void>;
};

/** Exponential backoff with full jitter; honours Retry-After when the server sends one. */
export async function withRetry<T>(fn: (attempt: number) => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { retries = 4, baseDelayMs = 1500, maxDelayMs = 20_000, onRetry, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = opts;
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt > retries || !isRetryable(err)) throw err;
      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const hinted = err instanceof HttpError ? err.retryAfterMs : undefined;
      const delay = hinted ?? Math.round(backoff / 2 + Math.random() * (backoff / 2));
      onRetry?.(attempt, err, delay);
      await sleep(delay);
    }
  }
}

export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const secs = Number(value);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}
