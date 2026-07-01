import { Redis } from "@upstash/redis";
import { getUpstashConfig } from "@/lib/env";

export interface KVClient {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, opts?: { ttlMs?: number }): Promise<void>;
  del(key: string): Promise<void>;
  /** Set only if the key doesn't exist. Returns true if the lock was acquired. */
  setNX(key: string, value: string, ttlMs: number): Promise<boolean>;
}

class UpstashKVClient implements KVClient {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    return (await this.redis.get<T>(key)) ?? null;
  }

  async set<T>(key: string, value: T, opts?: { ttlMs?: number }): Promise<void> {
    if (opts?.ttlMs) {
      await this.redis.set(key, value, { px: opts.ttlMs });
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async setNX(key: string, value: string, ttlMs: number): Promise<boolean> {
    const result = await this.redis.set(key, value, { nx: true, px: ttlMs });
    return result === "OK";
  }
}

interface MemoryEntry {
  value: unknown;
  expiresAt: number | null;
}

class InMemoryKVClient implements KVClient {
  private store = new Map<string, MemoryEntry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, opts?: { ttlMs?: number }): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: opts?.ttlMs ? Date.now() + opts.ttlMs : null,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async setNX(key: string, value: string, ttlMs: number): Promise<boolean> {
    const existing = await this.get(key);
    if (existing !== null) return false;
    await this.set(key, value, { ttlMs });
    return true;
  }
}

declare global {
  var __picapoolKV: KVClient | undefined;
}

export function getKV(): KVClient {
  if (globalThis.__picapoolKV) return globalThis.__picapoolKV;

  const config = getUpstashConfig();
  if (config) {
    globalThis.__picapoolKV = new UpstashKVClient(
      new Redis({ url: config.url, token: config.token })
    );
  } else {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[kv] UPSTASH_REDIS_REST_URL/TOKEN not set — using an in-memory KV fallback. " +
          "This is single-process only and unsuitable for production."
      );
    }
    globalThis.__picapoolKV = new InMemoryKVClient();
  }

  return globalThis.__picapoolKV;
}
