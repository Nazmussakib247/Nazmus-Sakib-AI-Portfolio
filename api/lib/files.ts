import type { Context, Next } from "hono";
import { getDb } from "../queries/connection";
import { profiles, siteSettings, uploads } from "@db/schema";
import { eq } from "drizzle-orm";

const SOCIAL_IMAGE_SETTING_KEY = "socialPreviewImageUrl";
const FAVICON_SETTING_KEY = "faviconUrl";

function getUploadId(value: string | null | undefined) {
  const match = value?.match(/\/api\/files\/(\d+)(?:[?#]|$)/);
  const id = match ? Number(match[1]) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Serves the Admin-selected social image at a stable public URL. */
export async function serveSocialPreviewImage(c: Context, next: Next) {
  try {
    const db = getDb();
    const rows = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, SOCIAL_IMAGE_SETTING_KEY))
      .limit(1);
    const id = getUploadId(rows[0]?.value);

    // Let the normal static-file handler serve the committed fallback image.
    if (!id) return next();

    const files = await db
      .select()
      .from(uploads)
      .where(eq(uploads.id, id))
      .limit(1);
    const file = files[0];

    // Deleted or invalid uploads automatically fall back to public/og-image.png.
    if (!file || !file.mimeType.startsWith("image/")) return next();

    const bytes = Buffer.from(file.data, "base64");
    return c.body(new Uint8Array(bytes), 200, {
      "Content-Type": file.mimeType,
      "Content-Length": String(bytes.length),
      // This URL is stable but its contents can change after an Admin update.
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
      "Content-Disposition": "inline",
    });
  } catch (error) {
    console.error("[seo] stable social image lookup failed:", error instanceof Error ? error.message : "unknown error");
    return next();
  }
}

/** Serves the Admin-selected favicon at a stable public URL. */
export async function serveFavicon(c: Context, next: Next) {
  try {
    const db = getDb();
    const rows = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, FAVICON_SETTING_KEY))
      .limit(1);
    const id = getUploadId(rows[0]?.value);
    if (!id) return next();

    const files = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
    const file = files[0];
    if (!file || !file.mimeType.startsWith("image/")) return next();

    const bytes = Buffer.from(file.data, "base64");
    return c.body(new Uint8Array(bytes), 200, {
      "Content-Type": file.mimeType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
      "Content-Disposition": "inline",
    });
  } catch (error) {
    console.error("[seo] stable favicon lookup failed:", error instanceof Error ? error.message : "unknown error");
    return next();
  }
}

/** Serves the configured profile CV as a tracked attachment. */
export async function serveCvDownload(c: Context) {
  try {
    const db = getDb();
    const profileRows = await db.select({ cvUrl: profiles.cvUrl }).from(profiles).limit(1);
    const id = getUploadId(profileRows[0]?.cvUrl);
    if (!id) return c.json({ error: "CV file is not configured" }, 404);

    const files = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
    const file = files[0];
    if (!file || file.mimeType !== "application/pdf") return c.json({ error: "Configured CV file is unavailable" }, 404);

    const bytes = Buffer.from(file.data, "base64");
    return c.body(new Uint8Array(bytes), 200, {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.filename)}"`,
    });
  } catch (error) {
    console.error("[cv] controlled download failed:", error instanceof Error ? error.message : "unknown error");
    return c.json({ error: "CV download unavailable" }, 503);
  }
}

/** Serves DB-stored uploads at GET /api/files/:id with long-lived caching. */
export async function serveUploadedFile(c: Context) {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ error: "Invalid file id" }, 400);
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(uploads)
    .where(eq(uploads.id, id))
    .limit(1);

  if (rows.length === 0) {
    return c.json({ error: "File not found" }, 404);
  }

  const file = rows[0];
  const bytes = Buffer.from(file.data, "base64");

  return c.body(new Uint8Array(bytes), 200, {
    "Content-Type": file.mimeType,
    "Content-Length": String(bytes.length),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
  });
}
