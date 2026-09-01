import { createHash } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, ilike, isNotNull, isNull, lt, lte, or, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { cvEvents, visitEvents } from "@db/schema";

const ipActivity = new Map<string, { windowStart: number; count: number; alerted: boolean }>();
const EVENT_WINDOW_MS = 5 * 60 * 1000;
const EVENT_THROTTLE_MS = 15 * 60 * 1000;
const SUSPICIOUS_REQUEST_LIMIT = 30;
const RETENTION_DAYS = 365;

const visitorFilterSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
  country: z.string().trim().regex(/^[A-Z]{2}$/).optional(),
  search: z.string().trim().max(160).optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
});

type VisitorFilterInput = z.infer<typeof visitorFilterSchema>;

const cvEventKindSchema = z.enum(["preview", "download"]);
const cvSourceSchema = z.enum(["direct", "google", "linkedin", "github", "medium", "referral", "other"]);
const cvFilterSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
  kind: cvEventKindSchema.optional(),
  source: cvSourceSchema.optional(),
  country: z.string().trim().regex(/^[A-Z]{2}$/).optional(),
  deviceType: z.enum(["Mobile", "Tablet", "Desktop", "Other"]).optional(),
  search: z.string().trim().max(160).optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
});

type CvFilterInput = z.infer<typeof cvFilterSchema>;

function buildVisitorFilters(input: VisitorFilterInput) {
  const start = input.startDate ? new Date(input.startDate) : new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
  const end = input.endDate ? new Date(input.endDate) : undefined;
  if (end && start > end) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The visitor date range is invalid." });
  }
  const search = input.search?.trim();
  const searchFilter = search
    ? or(
        ilike(visitEvents.ipAddress, `%${search}%`),
        ilike(visitEvents.country, `%${search.toUpperCase()}%`),
        ilike(visitEvents.path, `%${search}%`),
        ilike(visitEvents.referrerHost, `%${search}%`),
        ilike(visitEvents.userAgent, `%${search}%`),
      )
    : undefined;
  return and(
    isNull(visitEvents.deletedAt),
    gte(visitEvents.visitedAt, start),
    end ? lte(visitEvents.visitedAt, end) : undefined,
    input.country ? eq(visitEvents.country, input.country) : undefined,
    searchFilter,
  );
}

function buildCvFilters(input: CvFilterInput) {
  const start = input.startDate ? new Date(input.startDate) : new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
  const end = input.endDate ? new Date(input.endDate) : undefined;
  if (end && start > end) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The CV analytics date range is invalid." });
  }
  const search = input.search?.trim();
  const searchFilter = search
    ? or(
        ilike(cvEvents.ipAddress, `%${search}%`),
        ilike(cvEvents.country, `%${search.toUpperCase()}%`),
        ilike(cvEvents.source, `%${search.toLowerCase()}%`),
        ilike(cvEvents.path, `%${search}%`),
        ilike(cvEvents.referrerHost, `%${search}%`),
        ilike(cvEvents.userAgent, `%${search}%`),
      )
    : undefined;
  return and(
    isNull(cvEvents.deletedAt),
    gte(cvEvents.createdAt, start),
    end ? lte(cvEvents.createdAt, end) : undefined,
    input.kind ? eq(cvEvents.kind, input.kind) : undefined,
    input.source ? eq(cvEvents.source, input.source) : undefined,
    input.country ? eq(cvEvents.country, input.country) : undefined,
    input.deviceType ? eq(cvEvents.deviceType, input.deviceType) : undefined,
    searchFilter,
  );
}

function normalizeCountry(value: string | null) {
  const country = value?.trim().toUpperCase() || "ZZ";
  return /^[A-Z]{2}$/.test(country) ? country : "ZZ";
}

function getCountry(req: Request) {
  return normalizeCountry(req.headers.get("cf-ipcountry") || req.headers.get("x-country-code") || req.headers.get("x-vercel-ip-country") || req.headers.get("x-geo-country"));
}

function getClientIp(req: Request) {
  const raw = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  return raw.trim().replace(/[^-a-zA-Z0-9:._%]/g, "").slice(0, 128) || "unknown";
}

function getReferrerHost(req: Request) {
  const value = req.headers.get("referer");
  if (!value) return null;
  try { return new URL(value).hostname.slice(0, 255); } catch { return null; }
}

function getUserAgent(req: Request) {
  return (req.headers.get("user-agent") || "unknown").slice(0, 500);
}

function parseUserAgent(userAgent: string) {
  const deviceType = /tablet|ipad|playbook|silk/i.test(userAgent)
    ? "Tablet"
    : /mobile|iphone|android.*mobile|windows phone/i.test(userAgent)
      ? "Mobile"
      : "Desktop";

  const browser = /edg\//i.test(userAgent)
    ? "Edge"
    : /opr\//i.test(userAgent)
      ? "Opera"
      : /chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)
        ? "Chrome"
        : /firefox\//i.test(userAgent)
          ? "Firefox"
          : /safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)
            ? "Safari"
            : /googlebot|bingbot|duckduckbot/i.test(userAgent)
              ? "Bot"
              : "Other";

  const operatingSystem = /windows/i.test(userAgent)
    ? "Windows"
    : /android/i.test(userAgent)
      ? "Android"
      : /iphone|ipad|ipod/i.test(userAgent)
        ? "iOS"
        : /mac os x/i.test(userAgent)
          ? "macOS"
          : /linux/i.test(userAgent)
            ? "Linux"
            : "Other";

  return { deviceType, browser, operatingSystem };
}

function getVisitorHash(ipAddress: string, userAgent: string) {
  const salt = process.env.APP_SECRET || "cv-analytics";
  return createHash("sha256").update(`${salt}:${ipAddress}:${userAgent}`).digest("hex");
}

export async function ensureVisitEventsTable() {
  try {
    const db = getDb();
    await db.execute(sql`CREATE TABLE IF NOT EXISTS "visit_events" ("id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, "ip_address" varchar(128), "country" varchar(2) NOT NULL DEFAULT 'ZZ', "path" varchar(160) NOT NULL DEFAULT '/', "referrer_host" varchar(255), "user_agent" varchar(500), "is_suspicious" boolean NOT NULL DEFAULT false, "visited_at" timestamp NOT NULL DEFAULT now())`);
    await db.execute(sql`ALTER TABLE "visit_events" ADD COLUMN IF NOT EXISTS "ip_address" varchar(128)`);
    await db.execute(sql`ALTER TABLE "visit_events" ADD COLUMN IF NOT EXISTS "user_agent" varchar(500)`);
    await db.execute(sql`ALTER TABLE "visit_events" ADD COLUMN IF NOT EXISTS "is_suspicious" boolean NOT NULL DEFAULT false`);
    await db.execute(sql`ALTER TABLE "visit_events" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp`);
    await db.execute(sql`UPDATE "visit_events" SET "ip_address" = 'unknown' WHERE "ip_address" IS NULL`);
    await db.execute(sql`ALTER TABLE "visit_events" ALTER COLUMN "ip_address" SET NOT NULL`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "visit_events_visited_at_idx" ON "visit_events" ("visited_at")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "visit_events_ip_address_idx" ON "visit_events" ("ip_address")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "visit_events_country_idx" ON "visit_events" ("country")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "visit_events_deleted_at_idx" ON "visit_events" ("deleted_at")`);
  } catch (error) {
    console.error('[analytics] visitor schema guard failed', error);
  }
}

export async function ensureCvEventsTable() {
  try {
    const db = getDb();
    await db.execute(sql`CREATE TABLE IF NOT EXISTS "cv_events" ("id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, "kind" varchar(24) NOT NULL, "source" varchar(40) NOT NULL DEFAULT 'unknown', "path" varchar(160) NOT NULL DEFAULT '/#cv', "referrer_host" varchar(255), "ip_address" varchar(128) NOT NULL, "country" varchar(2) NOT NULL DEFAULT 'ZZ', "device_type" varchar(32), "browser" varchar(64), "operating_system" varchar(64), "user_agent" varchar(500), "visitor_hash" varchar(64), "deleted_at" timestamp, "created_at" timestamp NOT NULL DEFAULT now())`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "cv_events_kind_created_at_idx" ON "cv_events" ("kind", "created_at")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "cv_events_created_at_idx" ON "cv_events" ("created_at")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "cv_events_visitor_hash_idx" ON "cv_events" ("visitor_hash")`);
  } catch (error) {
    console.error('[analytics] CV schema guard failed', error);
  }
}

export const analyticsRouter = createRouter({
  track: publicQuery.input(z.object({ path: z.string().trim().min(1).max(160).default("/") })).mutation(async ({ input, ctx }) => {
    const ipAddress = getClientIp(ctx.req);
    const now = Date.now();
    const activity = ipActivity.get(ipAddress);
    const current = !activity || now - activity.windowStart >= EVENT_WINDOW_MS
      ? { windowStart: now, count: 1, alerted: false }
      : { ...activity, count: activity.count + 1 };
    ipActivity.set(ipAddress, current);
    const isSuspicious = current.count >= SUSPICIOUS_REQUEST_LIMIT;
    const shouldRecordVisit = !activity || now - activity.windowStart >= EVENT_THROTTLE_MS;
    const shouldRecordAlert = isSuspicious && !current.alerted;
    if (!shouldRecordVisit && !shouldRecordAlert) return { recorded: false, suspicious: isSuspicious };
    if (shouldRecordAlert) current.alerted = true;

    await getDb().insert(visitEvents).values({
      ipAddress,
      country: getCountry(ctx.req),
      path: input.path,
      referrerHost: getReferrerHost(ctx.req),
      userAgent: getUserAgent(ctx.req),
      isSuspicious,
    });
    return { recorded: shouldRecordVisit, suspicious: isSuspicious };
  }),

  trackCv: publicQuery.input(z.object({
    kind: cvEventKindSchema,
    source: cvSourceSchema.default("direct"),
    path: z.string().trim().min(1).max(160).default("/#cv"),
  })).mutation(async ({ input, ctx }) => {
    const ipAddress = getClientIp(ctx.req);
    const userAgent = getUserAgent(ctx.req);
    const parsedAgent = parseUserAgent(userAgent);
    await getDb().insert(cvEvents).values({
      kind: input.kind,
      source: input.source,
      path: input.path,
      referrerHost: getReferrerHost(ctx.req),
      ipAddress,
      country: getCountry(ctx.req),
      deviceType: parsedAgent.deviceType,
      browser: parsedAgent.browser,
      operatingSystem: parsedAgent.operatingSystem,
      userAgent,
      visitorHash: getVisitorHash(ipAddress, userAgent),
    });
    return { recorded: true };
  }),
});

export const analyticsAdminRouter = createAdminRouter({
  summary: adminProcedure.input(z.object({ days: z.number().int().min(1).max(365).default(30) }).optional()).query(async ({ input }) => {
    const db = getDb();
    const days = input?.days || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const retentionCutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await db.delete(visitEvents).where(lt(visitEvents.visitedAt, retentionCutoff));
    const range = gte(visitEvents.visitedAt, since);
    const [totals] = await db.select({ total: sql<number>`count(*)`, uniqueIps: sql<number>`count(distinct ${visitEvents.ipAddress})` }).from(visitEvents).where(range);
    const [alerts] = await db.select({ total: sql<number>`count(*)` }).from(visitEvents).where(and(range, eq(visitEvents.isSuspicious, true)));
    const countries = await db.select({ country: visitEvents.country, visits: sql<number>`count(*)` }).from(visitEvents).where(range).groupBy(visitEvents.country).orderBy(desc(sql`count(*)`));
    const paths = await db.select({ path: visitEvents.path, visits: sql<number>`count(*)` }).from(visitEvents).where(range).groupBy(visitEvents.path).orderBy(desc(sql`count(*)`)).limit(20);
    const ips = await db.select({
      ipAddress: visitEvents.ipAddress,
      country: sql<string>`(array_agg(${visitEvents.country} order by ${visitEvents.visitedAt} desc))[1]`,
      visits: sql<number>`count(*)`,
      suspicious: sql<number>`sum(case when ${visitEvents.isSuspicious} then 1 else 0 end)`,
      lastSeen: sql<Date>`max(${visitEvents.visitedAt})`,
    }).from(visitEvents).where(range).groupBy(visitEvents.ipAddress).orderBy(desc(sql`count(*)`));
    const daily = await db.select({ day: sql<string>`to_char(date_trunc('day', ${visitEvents.visitedAt}), 'YYYY-MM-DD')`, visits: sql<number>`count(*)` }).from(visitEvents).where(range).groupBy(sql`date_trunc('day', ${visitEvents.visitedAt})`).orderBy(sql`date_trunc('day', ${visitEvents.visitedAt})`);
    return {
      periodDays: days,
      totalVisits: Number(totals?.total || 0),
      uniqueIps: Number(totals?.uniqueIps || 0),
      suspiciousEvents: Number(alerts?.total || 0),
      countries: countries.map((row) => ({ country: row.country, visits: Number(row.visits) })),
      topPaths: paths.map((row) => ({ path: row.path, visits: Number(row.visits) })),
      topIps: ips.map((row) => ({ ipAddress: row.ipAddress, country: row.country, visits: Number(row.visits), suspicious: Number(row.suspicious || 0), lastSeen: row.lastSeen })),
      daily: daily.map((row) => ({ day: row.day, visits: Number(row.visits) })),
    };
  }),

  events: adminProcedure
    .input(visitorFilterSchema.extend({
      page: z.number().int().min(1).max(10000).default(1),
      pageSize: z.number().int().min(10).max(100).default(25),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const filters = buildVisitorFilters(input);
      const offset = (input.page - 1) * input.pageSize;
      const [countRow] = await db.select({ total: sql<number>`count(*)` }).from(visitEvents).where(filters);
      const rows = await db.select({
        id: visitEvents.id,
        ipAddress: visitEvents.ipAddress,
        country: visitEvents.country,
        path: visitEvents.path,
        referrerHost: visitEvents.referrerHost,
        userAgent: visitEvents.userAgent,
        suspicious: visitEvents.isSuspicious,
        visitedAt: visitEvents.visitedAt,
      }).from(visitEvents).where(filters).orderBy(desc(visitEvents.visitedAt)).limit(input.pageSize).offset(offset);
      const daily = await db.select({
        day: sql<string>`to_char(date_trunc('day', ${visitEvents.visitedAt}), 'YYYY-MM-DD')`,
        visits: sql<number>`count(*)`,
      }).from(visitEvents).where(filters).groupBy(sql`date_trunc('day', ${visitEvents.visitedAt})`).orderBy(sql`date_trunc('day', ${visitEvents.visitedAt})`);
      const total = Number(countRow?.total || 0);
      return {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
        events: rows,
        daily: daily.map((row) => ({ day: row.day, visits: Number(row.visits) })),
      };
    }),

  deleteFiltered: adminProcedure
    .input(visitorFilterSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const filters = buildVisitorFilters(input);
      const now = new Date();
      const deleted = await db.update(visitEvents).set({ deletedAt: now }).where(filters).returning({ id: visitEvents.id });
      return { deletedCount: deleted.length };
    }),

  recycleBin: adminProcedure.query(async () => {
    const db = getDb();
    return db.select({
      id: visitEvents.id,
      ipAddress: visitEvents.ipAddress,
      country: visitEvents.country,
      path: visitEvents.path,
      visitedAt: visitEvents.visitedAt,
      deletedAt: visitEvents.deletedAt,
    }).from(visitEvents).where(isNotNull(visitEvents.deletedAt)).orderBy(desc(visitEvents.deletedAt)).limit(100);
  }),

  restore: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.update(visitEvents).set({ deletedAt: null }).where(and(eq(visitEvents.id, input.id), isNotNull(visitEvents.deletedAt)));
    return { success: true };
  }),

  permanentlyDelete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = getDb();
    const deleted = await db.delete(visitEvents).where(and(eq(visitEvents.id, input.id), isNotNull(visitEvents.deletedAt))).returning({ id: visitEvents.id });
    return { success: deleted.length > 0 };
  }),

  cvSummary: adminProcedure.input(cvFilterSchema.optional()).query(async ({ input }) => {
    const db = getDb();
    const filtersInput = cvFilterSchema.parse(input ?? {});
    const filters = buildCvFilters(filtersInput);
    const retentionCutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await db.delete(cvEvents).where(lt(cvEvents.createdAt, retentionCutoff));

    const [totals] = await db.select({ total: sql<number>`count(*)`, uniqueViewers: sql<number>`count(distinct ${cvEvents.visitorHash})` }).from(cvEvents).where(filters);
    const [previews] = await db.select({ total: sql<number>`count(*)` }).from(cvEvents).where(and(filters, eq(cvEvents.kind, "preview")));
    const [downloads] = await db.select({ total: sql<number>`count(*)` }).from(cvEvents).where(and(filters, eq(cvEvents.kind, "download")));
    const dailyRows = await db.select({
      day: sql<string>`to_char(date_trunc('day', ${cvEvents.createdAt}), 'YYYY-MM-DD')`,
      kind: cvEvents.kind,
      events: sql<number>`count(*)`,
    }).from(cvEvents).where(filters).groupBy(sql`date_trunc('day', ${cvEvents.createdAt})`, cvEvents.kind).orderBy(sql`date_trunc('day', ${cvEvents.createdAt})`);
    const dailyMap = new Map<string, { day: string; previews: number; downloads: number }>();
    for (const row of dailyRows) {
      const current = dailyMap.get(row.day) || { day: row.day, previews: 0, downloads: 0 };
      if (row.kind === "preview") current.previews = Number(row.events);
      if (row.kind === "download") current.downloads = Number(row.events);
      dailyMap.set(row.day, current);
    }
    const sources = await db.select({ source: cvEvents.source, events: sql<number>`count(*)` }).from(cvEvents).where(filters).groupBy(cvEvents.source).orderBy(desc(sql`count(*)`));
    const countries = await db.select({ country: cvEvents.country, events: sql<number>`count(*)` }).from(cvEvents).where(filters).groupBy(cvEvents.country).orderBy(desc(sql`count(*)`));
    const devices = await db.select({ deviceType: cvEvents.deviceType, events: sql<number>`count(*)` }).from(cvEvents).where(filters).groupBy(cvEvents.deviceType).orderBy(desc(sql`count(*)`));
    const paths = await db.select({ path: cvEvents.path, events: sql<number>`count(*)` }).from(cvEvents).where(filters).groupBy(cvEvents.path).orderBy(desc(sql`count(*)`)).limit(20);
    const totalPreviews = Number(previews?.total || 0);
    const totalDownloads = Number(downloads?.total || 0);
    return {
      periodDays: filtersInput.days,
      totalEvents: Number(totals?.total || 0),
      previewViews: totalPreviews,
      downloads: totalDownloads,
      uniqueViewers: Number(totals?.uniqueViewers || 0),
      conversionRate: totalPreviews ? Number(((totalDownloads / totalPreviews) * 100).toFixed(1)) : 0,
      daily: Array.from(dailyMap.values()),
      sources: sources.map((row) => ({ source: row.source, events: Number(row.events) })),
      countries: countries.map((row) => ({ country: row.country, events: Number(row.events) })),
      devices: devices.map((row) => ({ deviceType: row.deviceType || "Unknown", events: Number(row.events) })),
      topPaths: paths.map((row) => ({ path: row.path, events: Number(row.events) })),
    };
  }),

  cvEvents: adminProcedure
    .input(cvFilterSchema.extend({
      page: z.number().int().min(1).max(10000).default(1),
      pageSize: z.number().int().min(10).max(100).default(25),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const filters = buildCvFilters(input);
      const offset = (input.page - 1) * input.pageSize;
      const [countRow] = await db.select({ total: sql<number>`count(*)` }).from(cvEvents).where(filters);
      const rows = await db.select({
        id: cvEvents.id,
        kind: cvEvents.kind,
        source: cvEvents.source,
        path: cvEvents.path,
        referrerHost: cvEvents.referrerHost,
        ipAddress: cvEvents.ipAddress,
        country: cvEvents.country,
        deviceType: cvEvents.deviceType,
        browser: cvEvents.browser,
        operatingSystem: cvEvents.operatingSystem,
        userAgent: cvEvents.userAgent,
        visitorHash: cvEvents.visitorHash,
        createdAt: cvEvents.createdAt,
      }).from(cvEvents).where(filters).orderBy(desc(cvEvents.createdAt)).limit(input.pageSize).offset(offset);
      const total = Number(countRow?.total || 0);
      return {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
        events: rows,
      };
    }),

  cvDeleteFiltered: adminProcedure
    .input(cvFilterSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const filters = buildCvFilters(input);
      const deleted = await db.update(cvEvents).set({ deletedAt: new Date() }).where(filters).returning({ id: cvEvents.id });
      return { deletedCount: deleted.length };
    }),

  cvRecycleBin: adminProcedure.query(async () => {
    const db = getDb();
    return db.select({
      id: cvEvents.id,
      kind: cvEvents.kind,
      source: cvEvents.source,
      ipAddress: cvEvents.ipAddress,
      country: cvEvents.country,
      deviceType: cvEvents.deviceType,
      createdAt: cvEvents.createdAt,
      deletedAt: cvEvents.deletedAt,
    }).from(cvEvents).where(isNotNull(cvEvents.deletedAt)).orderBy(desc(cvEvents.deletedAt)).limit(100);
  }),

  cvRestore: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.update(cvEvents).set({ deletedAt: null }).where(and(eq(cvEvents.id, input.id), isNotNull(cvEvents.deletedAt)));
    return { success: true };
  }),

  cvPermanentlyDelete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = getDb();
    const deleted = await db.delete(cvEvents).where(and(eq(cvEvents.id, input.id), isNotNull(cvEvents.deletedAt))).returning({ id: cvEvents.id });
    return { success: deleted.length > 0 };
  }),
});
