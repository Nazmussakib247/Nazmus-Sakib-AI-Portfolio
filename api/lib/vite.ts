import type { Hono } from "hono";
import type { Context } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";
import { getDb } from "../queries/connection";
import { profiles } from "@db/schema";

type App = Hono<{ Bindings: HttpBindings }>;

const fallbackProfileImage = "/images/profile-avatar.jpg";

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getPublicOrigin(c: Context) {
  const requestUrl = new URL(c.req.url);
  const forwardedHost = c.req.header("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = c.req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = forwardedHost || requestUrl.host;
  const protocol = forwardedProto || requestUrl.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

function getAbsoluteImageUrl(c: Context, value: string | null | undefined) {
  const origin = getPublicOrigin(c);
  try {
    return new URL(value?.trim() || fallbackProfileImage, origin).href;
  } catch {
    return new URL(fallbackProfileImage, origin).href;
  }
}

async function getProfileImageUrl(c: Context) {
  try {
    const db = getDb();
    const rows = await db.select({ avatarUrl: profiles.avatarUrl }).from(profiles).limit(1);
    return getAbsoluteImageUrl(c, rows[0]?.avatarUrl);
  } catch (error) {
    console.error("[seo] profile image lookup failed:", error instanceof Error ? error.message : "unknown error");
    return getAbsoluteImageUrl(c, fallbackProfileImage);
  }
}

function injectProfileImage(html: string, imageUrl: string) {
  const escapedImageUrl = escapeHtmlAttribute(imageUrl);
  let updated = html.replace(
    /(<meta\s+property="og:image"\s+content=")[^"]*(")/i,
    `$1${escapedImageUrl}$2`,
  );
  updated = updated.replace(
    /(<meta\s+name="twitter:image"\s+content=")[^"]*(")/i,
    `$1${escapedImageUrl}$2`,
  );
  updated = updated.replace(
    /("image"\s*:\s*")[^"]*(")/i,
    `$1${escapedImageUrl}$2`,
  );
  return updated;
}

async function renderIndex(c: Context, indexPath: string) {
  const content = fs.readFileSync(indexPath, "utf-8");
  const imageUrl = await getProfileImageUrl(c);
  return c.html(injectProfileImage(content, imageUrl));
}

export function serveStaticFiles(app: App) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");
  const indexPath = path.resolve(distPath, "index.html");

  // Render the document root dynamically so social crawlers see the CMS avatar.
  app.get("/", (c) => renderIndex(c, indexPath));
  app.use("*", serveStatic({ root: "./dist/public" }));

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    return renderIndex(c, indexPath);
  });
}
