import type { Hono } from "hono";
import type { Context } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";
import { getDb } from "../queries/connection";
import { profiles, siteSettings } from "@db/schema";

type App = Hono<{ Bindings: HttpBindings }>;

type SeoData = {
  title: string;
  description: string;
  canonicalUrl: string;
  socialImageUrl: string;
  socialImageAlt: string;
  faviconUrl: string;
  profileImageUrl: string;
  profile: {
    name: string;
    title: string;
    bio: string;
    githubUrl: string | null;
    linkedinUrl: string | null;
    mediumUrl: string | null;
  };
};

const fallbackProfileImage = "/images/profile-avatar.jpg";
const fallbackSocialImage = "/images/hero-portrait.jpg";
const fallbackTitle = "Nazmus Sakib — ML Engineer · AI Engineer · AI Product Engineer";
const fallbackDescription = "Portfolio of Nazmus Sakib, an ML Engineer and AI product builder working across NLP, LLMs, retrieval, full-stack systems, and intelligent automation.";

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

async function getSeoData(c: Context): Promise<SeoData> {
  const origin = getPublicOrigin(c);
  const defaults = {
    seoTitle: fallbackTitle,
    seoDescription: fallbackDescription,
    canonicalSiteUrl: `${origin}/`,
    socialPreviewImageUrl: fallbackSocialImage,
    socialPreviewImageAlt: "Nazmus Sakib — ML Engineer and AI product builder",
    faviconUrl: fallbackProfileImage,
  };

  try {
    const db = getDb();
    const [profileRows, settingRows] = await Promise.all([
      db.select({ name: profiles.name, title: profiles.title, bio: profiles.bio, avatarUrl: profiles.avatarUrl, githubUrl: profiles.githubUrl, linkedinUrl: profiles.linkedinUrl, mediumUrl: profiles.mediumUrl }).from(profiles).limit(1),
      db.select({ key: siteSettings.key, value: siteSettings.value }).from(siteSettings),
    ]);
    const settings = Object.fromEntries(settingRows.map((row) => [row.key, row.value || ""]));
    const profile = profileRows[0];
    const canonicalUrl = getAbsoluteUrl(c, settings.canonicalSiteUrl || defaults.canonicalSiteUrl, `${origin}/`).replace(/\/$/, "") + "/";
    const profileImageUrl = getAbsoluteUrl(c, profile?.avatarUrl, fallbackProfileImage);

    return {
      title: settings.seoTitle?.trim() || defaults.seoTitle,
      description: settings.seoDescription?.trim() || defaults.seoDescription,
      canonicalUrl,
      socialImageUrl: getAbsoluteUrl(c, settings.socialPreviewImageUrl, fallbackSocialImage),
      socialImageAlt: settings.socialPreviewImageAlt?.trim() || defaults.socialPreviewImageAlt,
      faviconUrl: getAbsoluteUrl(c, settings.faviconUrl, fallbackProfileImage),
      profileImageUrl,
      profile: {
        name: profile?.name || "Nazmus Sakib",
        title: profile?.title || "ML Engineer",
        bio: profile?.bio || fallbackDescription,
        githubUrl: profile?.githubUrl || null,
        linkedinUrl: profile?.linkedinUrl || null,
        mediumUrl: profile?.mediumUrl || null,
      },
    };
  } catch (error) {
    console.error("[seo] metadata lookup failed:", error instanceof Error ? error.message : "unknown error");
    return {
      title: defaults.seoTitle,
      description: defaults.seoDescription,
      canonicalUrl: defaults.canonicalSiteUrl,
      socialImageUrl: getAbsoluteUrl(c, defaults.socialPreviewImageUrl, fallbackSocialImage),
      socialImageAlt: defaults.socialPreviewImageAlt,
      faviconUrl: getAbsoluteUrl(c, defaults.faviconUrl, fallbackProfileImage),
      profileImageUrl: getAbsoluteUrl(c, fallbackProfileImage, fallbackProfileImage),
      profile: { name: "Nazmus Sakib", title: "ML Engineer", bio: fallbackDescription, githubUrl: null, linkedinUrl: null, mediumUrl: null },
    };
  }
}

function replaceMeta(html: string, attribute: "name" | "property", key: string, value: string) {
  const escaped = escapeHtmlAttribute(value);
  const pattern = new RegExp(`(<meta\\s+${attribute}="${key}"\\s+content=")[^"]*(")`, "i");
  return html.replace(pattern, `$1${escaped}$2`);
}

function injectSeo(html: string, data: SeoData) {
  let updated = html;
  updated = updated.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtmlAttribute(data.title)}</title>`);
  updated = updated.replace(/(<link\\s+rel="canonical"\\s+href=")[^"]*(")/i, `$1${escapeHtmlAttribute(data.canonicalUrl)}$2`);
  updated = replaceMeta(updated, "name", "description", data.description);
  updated = replaceMeta(updated, "property", "og:url", data.canonicalUrl);
  updated = replaceMeta(updated, "property", "og:title", data.title);
  updated = replaceMeta(updated, "property", "og:description", data.description);
  updated = replaceMeta(updated, "property", "og:image", data.socialImageUrl);
  updated = replaceMeta(updated, "property", "og:image:alt", data.socialImageAlt);
  updated = replaceMeta(updated, "name", "twitter:title", data.title);
  updated = replaceMeta(updated, "name", "twitter:description", data.description);
  updated = replaceMeta(updated, "name", "twitter:image", data.socialImageUrl);
  updated = replaceMeta(updated, "name", "twitter:image:alt", data.socialImageAlt);
  updated = updated.replace(/(<link\\s+rel="icon"[^>]*href=")[^"]*(")/i, `$1${escapeHtmlAttribute(data.faviconUrl)}$2`);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: data.profile.name,
        jobTitle: data.profile.title,
        description: data.profile.bio,
        url: data.canonicalUrl,
        image: data.profileImageUrl,
        sameAs: [data.profile.githubUrl, data.profile.linkedinUrl, data.profile.mediumUrl].filter(Boolean),
      },
      {
        "@type": "WebSite",
        name: data.title,
        url: data.canonicalUrl,
        description: data.description,
      },
    ],
  };
  updated = updated.replace(/(<script[^>]+id="portfolio-structured-data"[^>]*>)[\s\S]*?(<\/script>)/i, `$1${escapeJsonForScript(structuredData)}$2`);
  return updated;
}

async function renderIndex(c: Context, indexPath: string) {
  const content = fs.readFileSync(indexPath, "utf-8");
  const data = await getSeoData(c);
  return c.html(injectSeo(content, data));
}

export function serveStaticFiles(app: App) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");
  const indexPath = path.resolve(distPath, "index.html");

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
