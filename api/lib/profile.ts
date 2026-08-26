import { sql, type SQLWrapper } from "drizzle-orm";
import { z } from "zod";

/**
 * The profile table predates platformLinks in some production databases.
 * Keep the first request after deployment safe while the idempotent migration
 * is applied by creating the nullable JSON column if it is missing.
 */
type SqlExecutor = { execute: (query: string | SQLWrapper) => unknown };

export async function ensureProfilePlatformLinksColumn(db: SqlExecutor) {
  await db.execute(sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platform_links jsonb`);
}

export const PLATFORM_LINK_KEYS = [
  "hackerrank",
  "kaggle",
  "leetcode",
  "codeforces",
  "huggingface",
  "gitlab",
  "stackoverflow",
  "devto",
  "behance",
  "dribbble",
] as const;

export type PlatformLinkKey = (typeof PLATFORM_LINK_KEYS)[number];

export const platformLinksSchema = z.record(
  z.string(),
  z.string().trim().url().max(500).or(z.literal("")),
);

export function cleanPlatformLinks(value: Record<string, string | undefined> | undefined) {
  return Object.fromEntries(
    PLATFORM_LINK_KEYS
      .map((key) => [key, typeof value?.[key] === "string" ? value[key].trim() : ""] as const)
      .filter(([, url]) => url.length > 0),
  );
}
