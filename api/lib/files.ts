import type { Context } from "hono";
import { getDb } from "../queries/connection";
import { uploads } from "@db/schema";
import { eq } from "drizzle-orm";

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
