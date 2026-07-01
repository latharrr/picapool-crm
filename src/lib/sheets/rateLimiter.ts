/**
 * Small concurrency-limited queue + exponential backoff retry wrapper around
 * every raw Sheets API call, so a burst of requests from one server instance
 * doesn't blow through Google's ~300 read / 60 write per-minute quota, and
 * transient 429/5xx responses get retried instead of surfacing as errors.
 */

const MAX_CONCURRENT = 4;
let active = 0;
const queue: Array<() => void> = [];

async function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return;
  }
  await new Promise<void>((resolve) => queue.push(resolve));
  active++;
}

function release(): void {
  active--;
  const next = queue.shift();
  if (next) next();
}

function isRetryableStatus(status: unknown): boolean {
  return status === 429 || (typeof status === "number" && status >= 500 && status < 600);
}

function extractStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const candidate = err as { code?: number; status?: number; response?: { status?: number } };
  return candidate.code ?? candidate.status ?? candidate.response?.status;
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 5): Promise<T> {
  await acquire();
  try {
    let attempt = 0;
    for (;;) {
      try {
        return await fn();
      } catch (err) {
        const status = extractStatus(err);
        if (!isRetryableStatus(status) || attempt >= retries) throw err;
        const backoffMs = Math.min(1000 * 2 ** attempt, 16_000) + Math.random() * 250;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        attempt++;
      }
    }
  } finally {
    release();
  }
}
