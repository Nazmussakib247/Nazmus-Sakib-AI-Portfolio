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

function assertSameOrigin(req: Request): void {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin) return;

  let requestOrigin: string;
  try {
    requestOrigin = new URL(req.url).origin;
  } catch {
    return;
  }

  if (origin !== requestOrigin) {
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
