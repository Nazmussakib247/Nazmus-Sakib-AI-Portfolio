import type { Hono } from "hono";
import type { Context } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";
import { and, eq, isNull, or } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { profiles, projects, siteSettings } from "@db/schema";
import { DEFAULT_SEO_DESCRIPTION, DEFAULT_SEO_TITLE, normalizeSeoSetting } from "./seo";

type App = Hono<{ Bindings: HttpBindings }>;

type SeoData = {
  title: string;
  description: string;
  canonicalUrl: string;
  socialImageUrl: string;
  socialImageAlt: string;
  socialImageMeta: { type: string; width: string; height: string };
  faviconUrl: string;
  profileImageUrl: string;
  sitePublished: boolean;
  profile: {
    name: string;
    title: string;
    bio: string;
    githubUrl: string | null;
    linkedinUrl: string | null;
    mediumUrl: string | null;
  };
  caseStudy: {
    title: string;
    description: string;
    canonicalUrl: string;
    imageUrl: string;
    imageAlt: string;
    projectName: string;
  } | null;
};

const fallbackProfileImage = "/images/profile-avatar.webp";
const fallbackSocialImage = "/og-image.png";
const legacySocialImageMarkers = ["/api/files/"];
const legacyProfileImageMarkers = ["/api/files/29", "/api/files/30"];
function resolveProfileImage(value: string | null | undefined) {
  const trimmed = value?.trim() || "";
  return !trimmed || legacyProfileImageMarkers.some((marker) => trimmed.includes(marker)) ? fallbackProfileImage : trimmed;
}

function resolveSocialImage(value: string | null | undefined) {
  const trimmed = value?.trim() || "";
  return !trimmed || legacySocialImageMarkers.some((marker) => trimmed.includes(marker)) ? fallbackSocialImage : trimmed;
}

function getSocialImageMeta() {
  return { type: 'image/png', width: '1200', height: '630' };
}
const fallbackTitle = DEFAULT_SEO_TITLE;
const fallbackDescription = DEFAULT_SEO_DESCRIPTION;

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeJsonForScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function getPublicOrigin(c: Context) {
  const requestUrl = new URL(c.req.url);
  const forwardedHost = c.req.header("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = c.req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = forwardedHost || requestUrl.host;
  const protocol = forwardedProto || requestUrl.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

function getAbsoluteUrl(c: Context, value: string | null | undefined, fallback: string) {
  const origin = getPublicOrigin(c);
  try {
    return new URL(value?.trim() || fallback, origin).href;
  } catch {
    return new URL(fallback, origin).href;
  }
}

function addAssetVersion(url: string, updatedAt: Date | string | null | undefined) {
  if (!updatedAt) return url;
  const timestamp = new Date(updatedAt).getTime();
  if (!Number.isFinite(timestamp)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}v=${timestamp}`;
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>;
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as Array<Record<string, unknown>> : [];
  } catch {
    return [];
  }
}

function getCaseStudySlug(c: Context) {
  const pathname = new URL(c.req.url).pathname;
  const match = pathname.match(/^\/projects\/([^/]+)\/case-study\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function getPublicCaseStudy(c: Context) {
  const slug = getCaseStudySlug(c);
  if (!slug) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.slug, slug),
      eq(projects.caseStudyEnabled, true),
      or(eq(projects.isFeatured, true), isNull(projects.isFeatured)),
    ))
    .limit(1);
  const project = rows[0];
  if (!project) return null;

  const media = parseJsonArray(project.caseStudyMedia);
  const firstMediaUrl = typeof media[0]?.url === "string" ? media[0].url : null;
  const firstMediaAlt = typeof media[0]?.altText === "string" ? media[0].altText : null;
  const imageUrl = project.thumbnailUrl || firstMediaUrl || fallbackSocialImage;
  const description = project.caseStudySummary?.trim() || project.description;
  const canonicalUrl = new URL(`/projects/${encodeURIComponent(project.slug || slug)}/case-study`, getPublicOrigin(c)).href;

  return {
    title: `${project.title} Case Study | Nazmus Sakib`,
    description,
    canonicalUrl,
    imageUrl: getAbsoluteUrl(c, imageUrl, fallbackSocialImage),
    imageAlt: firstMediaAlt || `${project.title} case study — Nazmus Sakib`,
    projectName: project.title,
  };
}

async function getSeoData(c: Context): Promise<SeoData> {
  const origin = getPublicOrigin(c);
  const defaults = {
    seoTitle: fallbackTitle,
    seoDescription: fallbackDescription,
    canonicalSiteUrl: `${origin}/`,
    socialPreviewImageUrl: fallbackSocialImage,
    socialPreviewImageAlt: "Nazmus Sakib — ML Engineer and AI product builder",
    faviconUrl: fallbackProfileImage,
    sitePublished: true,
  };

  try {
    const db = getDb();
    const [profileRows, settingRows] = await Promise.all([
      db.select({ name: profiles.name, title: profiles.title, bio: profiles.bio, avatarUrl: profiles.avatarUrl, githubUrl: profiles.githubUrl, linkedinUrl: profiles.linkedinUrl, mediumUrl: profiles.mediumUrl }).from(profiles).limit(1),
      db.select({ key: siteSettings.key, value: siteSettings.value, updatedAt: siteSettings.updatedAt }).from(siteSettings),
    ]);
    const settings = Object.fromEntries(settingRows.map((row) => [row.key, row.value || ""]));
    const settingUpdatedAt = (key: string) => settingRows.find((row) => row.key === key)?.updatedAt;
    const profile = profileRows[0];
    const canonicalUrl = getAbsoluteUrl(c, settings.canonicalSiteUrl || defaults.canonicalSiteUrl, `${origin}/`).replace(/\/$/, "") + "/";
    const profileImageUrl = getAbsoluteUrl(c, resolveProfileImage(profile?.avatarUrl), fallbackProfileImage);
    const caseStudy = await getPublicCaseStudy(c);

    return {
      title: normalizeSeoSetting("seoTitle", settings.seoTitle) || defaults.seoTitle,
      description: normalizeSeoSetting("seoDescription", settings.seoDescription) || defaults.seoDescription,
      canonicalUrl,
      socialImageUrl: addAssetVersion(getAbsoluteUrl(c, resolveSocialImage(settings.socialPreviewImageUrl), fallbackSocialImage), settingUpdatedAt("socialPreviewImageUrl")),
      socialImageAlt: settings.socialPreviewImageAlt?.trim() || defaults.socialPreviewImageAlt,
      socialImageMeta: getSocialImageMeta(),
      faviconUrl: getAbsoluteUrl(c, "/favicon.png", "/favicon.png"),
      profileImageUrl,
      sitePublished: settings.sitePublished !== "false",
      profile: {
        name: profile?.name || "Nazmus Sakib",
        title: profile?.title || "AI Engineer",
        bio: profile?.bio || fallbackDescription,
        githubUrl: profile?.githubUrl || null,
        linkedinUrl: profile?.linkedinUrl || null,
        mediumUrl: profile?.mediumUrl || null,
      },
      caseStudy,
    };
  } catch (error) {
    console.error("[seo] metadata lookup failed:", error instanceof Error ? error.message : "unknown error");
    return {
      title: defaults.seoTitle,
      description: defaults.seoDescription,
      canonicalUrl: defaults.canonicalSiteUrl,
      socialImageUrl: getAbsoluteUrl(c, resolveSocialImage(defaults.socialPreviewImageUrl), fallbackSocialImage),
      socialImageAlt: defaults.socialPreviewImageAlt,
      socialImageMeta: getSocialImageMeta(),
      faviconUrl: getAbsoluteUrl(c, "/favicon.png", "/favicon.png"),
      profileImageUrl: getAbsoluteUrl(c, fallbackProfileImage, fallbackProfileImage),
      sitePublished: true,
      profile: { name: "Nazmus Sakib", title: "AI Engineer", bio: fallbackDescription, githubUrl: null, linkedinUrl: null, mediumUrl: null },
      caseStudy: null,
    };
  }
}

function replaceMeta(html: string, attribute: "name" | "property", key: string, value: string) {
  const escaped = escapeHtmlAttribute(value);
  const pattern = new RegExp(`(<meta\\s+${attribute}="${key}"\\s+content=")[^"]*(")`, "i");
  return html.replace(pattern, `$1${escaped}$2`);
}

function injectSeo(html: string, data: SeoData) {
  const title = data.caseStudy?.title || data.title;
  const description = data.caseStudy?.description || data.description;
  const canonicalUrl = data.caseStudy?.canonicalUrl || data.canonicalUrl;
  const homeUrl = data.caseStudy ? new URL("/", data.canonicalUrl).href : data.canonicalUrl;
  let updated = html;
  updated = updated.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtmlAttribute(title)}</title>`);
  updated = updated.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/i, `$1${escapeHtmlAttribute(canonicalUrl)}$2`);
  updated = replaceMeta(updated, "name", "description", description);
  updated = replaceMeta(updated, "property", "og:url", canonicalUrl);
  updated = replaceMeta(updated, "property", "og:title", title);
  updated = replaceMeta(updated, "property", "og:description", description);
  updated = replaceMeta(updated, "property", "og:image", data.socialImageUrl);
  updated = replaceMeta(updated, "property", "og:image:url", data.socialImageUrl);
  updated = replaceMeta(updated, "property", "og:image:secure_url", data.socialImageUrl);
  updated = replaceMeta(updated, "property", "og:image:type", data.socialImageMeta.type);
  updated = replaceMeta(updated, "property", "og:image:width", data.socialImageMeta.width);
  updated = replaceMeta(updated, "property", "og:image:height", data.socialImageMeta.height);
  updated = replaceMeta(updated, "property", "og:image:alt", data.caseStudy?.imageAlt || data.socialImageAlt);
  updated = replaceMeta(updated, "name", "twitter:title", title);
  updated = replaceMeta(updated, "name", "twitter:description", description);
  updated = replaceMeta(updated, "name", "twitter:image", data.socialImageUrl);
  updated = replaceMeta(updated, "name", "twitter:image:alt", data.caseStudy?.imageAlt || data.socialImageAlt);
  updated = updated.replace(/(<link\s+rel="icon"[^>]*href=")[^"]*(")/i, `$1${escapeHtmlAttribute(data.faviconUrl)}$2`);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: data.profile.name,
        jobTitle: data.profile.title,
        description: data.profile.bio,
        url: homeUrl,
        image: data.profileImageUrl,
        sameAs: [data.profile.githubUrl, data.profile.linkedinUrl, data.profile.mediumUrl].filter(Boolean),
      },
      {
        "@type": "WebSite",
        name: data.title,
        url: homeUrl,
        description: data.description,
      },
    ] as Array<Record<string, unknown>>,
  };
  if (data.caseStudy) {
    structuredData["@graph"].push({
      "@type": "CreativeWork",
      name: data.caseStudy.projectName,
      headline: data.caseStudy.title,
      description: data.caseStudy.description,
      url: data.caseStudy.canonicalUrl,
      image: data.caseStudy.imageUrl,
      author: { "@type": "Person", name: data.profile.name, url: data.canonicalUrl },
      mainEntityOfPage: data.caseStudy.canonicalUrl,
    });
  }
  updated = updated.replace(/(<script[^>]+id="portfolio-structured-data"[^>]*>)[\s\S]*?(<\/script>)/i, `$1${escapeJsonForScript(structuredData)}$2`);
  return updated;
}


function unpublishedPage() {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portfolio temporarily unavailable</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#05060f;color:#e5e7eb;font-family:system-ui,sans-serif;text-align:center}main{max-width:560px;padding:32px}h1{color:#e8b923;font-size:clamp(2rem,6vw,3.5rem);margin:0 0 16px}p{color:#9ca3af;line-height:1.7}</style></head><body><main><h1>Portfolio temporarily unavailable</h1><p>This portfolio is currently unpublished. Please check back soon.</p></main></body></html>`;
}

async function renderIndex(c: Context, indexPath: string) {
  const content = fs.readFileSync(indexPath, "utf-8");
  const data = await getSeoData(c);
  const pathname = new URL(c.req.url).pathname;
  if (!pathname.startsWith("/admin") && !data.sitePublished) return c.html(unpublishedPage(), 503);
  return c.html(injectSeo(content, data));
}

export function serveStaticFiles(app: App) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");
  const indexPath = path.resolve(distPath, "index.html");

  // HTML must revalidate so deployments and Admin-managed metadata become visible.
  // Hashed build assets can be cached for a year because their filenames change per build.
  app.use("*", async (c, next) => {
    const pathname = new URL(c.req.url).pathname;
    if (pathname === "/" || pathname.endsWith(".html")) {
      c.header("Cache-Control", "no-cache, must-revalidate");
    } else if (pathname.startsWith("/assets/")) {
      c.header("Cache-Control", "public, max-age=31536000, immutable");
    } else if (pathname.startsWith("/images/") || pathname.startsWith("/fonts/")) {
      c.header("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    }
    await next();
  });

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
