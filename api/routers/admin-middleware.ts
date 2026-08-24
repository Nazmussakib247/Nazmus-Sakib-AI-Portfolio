import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "../context";
import { getDb } from "../queries/connection";
import { adminSessions } from "@db/schema";
import { eq } from "drizzle-orm";
import {
  clearAdminSessionCookie,
  getAdminSessionToken,
  hashSessionToken,
} from "../lib/admin-auth";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createAdminRouter = t.router;

function getPublicRequestOrigin(req: Request): string | null {
  try {
    const requestUrl = new URL(req.url);
    const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const host = forwardedHost || req.headers.get("host") || requestUrl.host;
    const protocol = forwardedProto || requestUrl.protocol.replace(":", "");
    return `${protocol}://${host}`;
  } catch {
    return null;
  }
}

const trustedAdminOrigins = new Set([
  "https://nazmus-sakib-ai-portfolio.onrender.com",
  "https://nazmussakib.tech",
  "https://www.nazmussakib.tech",
  ...(process.env.PUBLIC_APP_ORIGINS || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean),
]);

function normalizeOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function assertSameOrigin(req: Request): void {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return;
  const origin = normalizeOrigin(req.headers.get("origin"));
  if (!origin) return;

  const requestOrigin = getPublicRequestOrigin(req);
  const allowedOrigins = new Set([requestOrigin, ...trustedAdminOrigins]);
  if (!allowedOrigins.has(origin)) {
    console.warn("[admin-csrf] rejected origin", {
      origin,
      requestOrigin,
      hasForwardedHost: Boolean(req.headers.get("x-forwarded-host")),
      hasForwardedProto: Boolean(req.headers.get("x-forwarded-proto")),
    });
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cross-site admin requests are not allowed",
    });
  }
}

const requireAdminSession = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  assertSameOrigin(ctx.req);

  const rawToken = getAdminSessionToken(ctx.req);
  if (!rawToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin session required",
    });
  }

  const token = hashSessionToken(rawToken);
  const db = getDb();
  const session = await db
    .select()
    .from(adminSessions)
    .where(eq(adminSessions.token, token))
    .limit(1);

  if (session.length === 0) {
    clearAdminSessionCookie(ctx.resHeaders, ctx.req.headers);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired session",
    });
  }

  if (new Date() > session[0].expiresAt) {
    await db.delete(adminSessions).where(eq(adminSessions.id, session[0].id));
    clearAdminSessionCookie(ctx.resHeaders, ctx.req.headers);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired session",
    });
  }

  return next({ ctx: { ...ctx, isAdmin: true } });
});

export const adminProcedure = t.procedure.use(requireAdminSession);
