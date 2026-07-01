import { getCronSecret } from "@/lib/env";

/**
 * Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when
 * that env var is set on the project — this just checks it matches.
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = getCronSecret();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
