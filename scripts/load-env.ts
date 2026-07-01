/**
 * Plain `dotenv/config` only loads a file literally named `.env`, not
 * Next.js's `.env.local` convention. Scripts import this instead so they
 * see the same env vars `next dev`/`next build` would.
 */
import { config } from "dotenv";
import path from "node:path";

// dotenv doesn't override already-set vars, so loading .env.local first
// means it wins over .env for any key present in both.
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });
