import { getEnvStatus, hasKVConfig } from "@/lib/env";
import { getKV } from "@/lib/kv/client";

export interface KVHealth {
  /** Whether Upstash env vars are set (false = using the in-memory dev fallback). */
  configured: boolean;
  reachable: boolean;
}

export interface SystemHealth {
  googleServiceAccount: boolean;
  rootSpreadsheet: boolean;
  authSecret: boolean;
  kv: KVHealth;
  lastCronRefresh: string | null;
}

async function checkKVReachable(): Promise<boolean> {
  try {
    const kv = getKV();
    const probeKey = "health:probe";
    await kv.set(probeKey, "ok", { ttlMs: 5000 });
    const value = await kv.get<string>(probeKey);
    await kv.del(probeKey);
    return value === "ok";
  } catch {
    return false;
  }
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const env = getEnvStatus();
  const reachable = await checkKVReachable();
  const lastCronRefresh = await getKV().get<string>("cron:last-refresh");

  return {
    googleServiceAccount: env.googleServiceAccount,
    rootSpreadsheet: env.rootSpreadsheet,
    authSecret: env.authSecret,
    kv: { configured: hasKVConfig(), reachable },
    lastCronRefresh,
  };
}
