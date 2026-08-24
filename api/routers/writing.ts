import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { writings } from "@db/schema";
import { and, asc, desc, eq, isNotNull, ne } from "drizzle-orm";

const DEFAULT_MEDIUM_FEED = "https://medium.com/feed/@nazmussakib.cse.nubt";
const REQUEST_HEADERS = { "user-agent": "Nazmus-Sakib-Portfolio/1.0" };

function resolveMediumFeedUrl(sourceUrl: string) {
  const trimmed = sourceUrl.trim();
  if (!trimmed) return DEFAULT_MEDIUM_FEED;

  try {
    const url = new URL(trimmed);
    if (url.hostname !== "medium.com" && !url.hostname.endsWith(".medium.com")) {
      throw new Error("Medium sync requires a medium.com profile or RSS URL.");
    }

    if (url.hostname === "medium.com") {
      const profileMatch = url.pathname.match(/^\/(?:feed\/)?@([^/]+)\/?$/i);
      if (profileMatch) return `https://medium.com/feed/@${profileMatch[1]}`;
      if (/^\/feed\/@[^/]+\/?$/i.test(url.pathname)) return url.toString();
    } else if (/^\/feed\/?$/i.test(url.pathname)) {
      return url.toString();
    }

    throw new Error("Enter a Medium profile URL such as https://medium.com/@username.");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Medium sync")) throw error;
    throw new Error("Enter a valid Medium profile or RSS URL.");
  }
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeExternalUrl(value: string | null | undefined) {
  if (!value) return "";
  try {
    const url = new URL(decodeXml(value));
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim().replace(/[?#].*$/, "").replace(/\/$/, "");
  }
}

function normalizeImageUrl(value: string | undefined) {
  if (!value) return undefined;
  const candidate = decodeXml(value).trim();
  if (!/^https?:\/\//i.test(candidate)) return undefined;
  return candidate;
}

function extractImageUrl(block: string) {
  const decoded = decodeXml(block);
  const candidates = [
    decoded.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i)?.[1],
    decoded.match(/<(?:img|source)[^>]+(?:src|data-src)=["']([^"']+)["']/i)?.[1],
    decoded.match(/<(?:img|source)[^>]+srcset=["']([^"']+)["']/i)?.[1]?.split(/\s+/)[0],
  ];
  return candidates.map(normalizeImageUrl).find(Boolean);
}

function inferCategory(title: string, description: string, categories: string[]) {
  const source = `${title} ${description} ${categories.join(" ")}`.toLowerCase();
  if (/ai|machine learning|deep learning|neural|llm|rag|nlp|computer vision/.test(source)) return "AI Engineering";
  if (/react|typescript|javascript|full stack|web development|frontend|backend|api/.test(source)) return "Full Stack";
  if (/python|data|sql|analytics|pandas/.test(source)) return "Data & Python";
  if (/automation|n8n|workflow|no-code/.test(source)) return "Automation";
  return categories[0] || "Technology";
}

async function fetchOpenGraphImage(articleUrl: string) {
  try {
    const response = await fetch(articleUrl, {
      headers: REQUEST_HEADERS,
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return undefined;
    const html = await response.text();
    const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const tag of metaTags) {
      const property = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
      if (property !== "og:image" && property !== "twitter:image") continue;
      const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
      const imageUrl = normalizeImageUrl(content);
      if (imageUrl) return imageUrl;
    }
  } catch {
    // Image enrichment is best-effort; the article can still be retained as an Admin draft.
  }
  return undefined;
}

export async function syncMediumWritings(sourceUrl = DEFAULT_MEDIUM_FEED) {
  const feedUrl = resolveMediumFeedUrl(sourceUrl);
  let response: Response;
  try {
    response = await fetch(feedUrl, {
      headers: REQUEST_HEADERS,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("Medium RSS could not be reached. Check your internet connection and try again.");
  }
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Medium profile feed not found (${feedUrl}). Check the Medium username in your profile settings.`);
    }
    throw new Error(`Medium RSS returned ${response.status}. Try again later.`);
  }

  const xml = await response.text();
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  const db = getDb();
  const existing = await db.select().from(writings);
  let created = 0;
  let updated = 0;
  let imageEnriched = 0;
  const duplicateIds = new Set<number>();

  for (const [index, item] of items.entries()) {
    const title = readTag(item, "title");
    const externalUrl = normalizeExternalUrl(readTag(item, "link"));
    if (!title || !externalUrl) continue;

    const matches = existing.filter((writing) => normalizeExternalUrl(writing.externalUrl) === externalUrl);
    // Prefer the existing image-bearing row when old seed/import logic created a duplicate.
    const match = matches.find((writing) => Boolean(writing.coverImageUrl)) || matches[0];
    matches.filter((writing) => writing.id !== match?.id).forEach((writing) => duplicateIds.add(writing.id));
    const rawDescription = readTag(item, "description") || readTag(item, "content:encoded");
    const excerpt = stripHtml(rawDescription).slice(0, 360);
    const categories = Array.from(item.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)).map((match) => decodeXml(match[1]));
    const parsedDate = new Date(readTag(item, "pubDate"));
    const createdAt = Number.isNaN(parsedDate.getTime()) ? match?.createdAt || new Date() : parsedDate;
    const rssImageUrl = extractImageUrl(item);
    const coverImageUrl = rssImageUrl || await fetchOpenGraphImage(externalUrl) || match?.coverImageUrl || null;
    if (coverImageUrl && !match?.coverImageUrl) imageEnriched += 1;

    const data = {
      title: title.slice(0, 255),
      excerpt,
      category: inferCategory(title, excerpt, categories),
      coverImageUrl,
      externalUrl,
      platform: "medium" as const,
      // Existing Admin decisions are preserved. New entries wait for Admin approval and are not featured.
      isPublished: match?.isPublished ?? false,
      isFeatured: match?.isFeatured ?? false,
      orderIndex: match?.orderIndex ?? index,
      createdAt,
      updatedAt: new Date(),
    };

    if (match) {
      await db.update(writings).set(data).where(eq(writings.id, match.id));
      updated += 1;
    } else {
      await db.insert(writings).values(data);
      created += 1;
    }
  }

  for (const duplicateId of duplicateIds) {
    await db.delete(writings).where(eq(writings.id, duplicateId));
  }

  return { success: true, created, updated, imageEnriched, deduplicated: duplicateIds.size, total: items.length };
}

export const writingRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(writings)
      .where(and(eq(writings.isPublished, true), isNotNull(writings.coverImageUrl), ne(writings.coverImageUrl, "")))
      .orderBy(asc(writings.orderIndex), desc(writings.createdAt));
  }),

  listAll: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(writings).orderBy(asc(writings.orderIndex), desc(writings.createdAt));
  }),
});

export const writingAdminRouter = createAdminRouter({
  syncMedium: adminProcedure
    .input(z.object({ feedUrl: z.string().trim().min(1).optional() }).optional())
    .mutation(async ({ input }) => syncMediumWritings(input?.feedUrl || DEFAULT_MEDIUM_FEED)),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        excerpt: z.string().optional(),
        category: z.string().optional(),
        coverImageUrl: z.string().optional(),
        externalUrl: z.string().optional(),
        platform: z.enum(["medium", "pdf", "blogspot"]).default("medium"),
        isPublished: z.boolean().default(false),
        isFeatured: z.boolean().default(false),
        orderIndex: z.number().int().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(writings).values(input);
      return { success: true, id: Number(result[0].insertId) };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        excerpt: z.string().optional(),
        category: z.string().optional(),
        coverImageUrl: z.string().optional(),
        externalUrl: z.string().optional(),
        platform: z.enum(["medium", "pdf", "blogspot"]).optional(),
        isPublished: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        orderIndex: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(writings).set({ ...data, updatedAt: new Date() }).where(eq(writings.id, id));
      return { success: true };
    }),

  reorder: adminProcedure
    .input(z.object({ id: z.number(), orderIndex: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(writings).set({ orderIndex: input.orderIndex, updatedAt: new Date() }).where(eq(writings.id, input.id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(writings).where(eq(writings.id, input.id));
      return { success: true };
    }),
});
