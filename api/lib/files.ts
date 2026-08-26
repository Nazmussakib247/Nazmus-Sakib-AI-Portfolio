import type { Context, Next } from "hono";
import { getDb } from "../queries/connection";
import { siteSettings, uploads } from "@db/schema";
import { eq } from "drizzle-orm";

const SOCIAL_IMAGE_SETTING_KEY = "socialPreviewImageUrl";

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
