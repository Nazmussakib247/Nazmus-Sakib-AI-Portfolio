import type { Context } from "hono";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import { projects } from "@db/schema";
import { getDb } from "../queries/connection";

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function getPublicOrigin(c: Context) {
  const requestUrl = new URL(c.req.url);
  const forwardedHost = c.req.header("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = c.req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = forwardedHost || requestUrl.host;
  const protocol = forwardedProto || requestUrl.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

function formatLastModified(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function urlEntry(loc: string, lastmod: string | null, changefreq: "weekly" | "monthly", priority: string) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].filter(Boolean).join("\n");
}

export async function serveSitemap(c: Context) {
  const origin = getPublicOrigin(c);
  const entries = [urlEntry(`${origin}/`, null, "weekly", "1.0")];

  try {
    const db = getDb();
    const publicProjects = await db
      .select({ slug: projects.slug, updatedAt: projects.updatedAt })
      .from(projects)
      .where(and(
        or(eq(projects.isFeatured, true), isNull(projects.isFeatured)),
        eq(projects.caseStudyEnabled, true),
      ))
      .orderBy(asc(projects.orderIndex), asc(projects.id));

    for (const project of publicProjects) {
      if (!project.slug?.trim()) continue;
      const slug = encodeURIComponent(project.slug.trim());
      entries.push(urlEntry(`${origin}/projects/${slug}/case-study`, formatLastModified(project.updatedAt), "monthly", "0.8"));
    }
  } catch (error) {
    console.error("[seo] sitemap lookup failed", error instanceof Error ? error.message : "unknown error");
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries.join("\n"),
    "</urlset>",
    "",
  ].join("\n");

  return c.body(xml, 200, {
    "Content-Type": "application/xml; charset=UTF-8",
    "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
  });
}
