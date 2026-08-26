import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { adminCredentials, adminLoginAttempts, adminPasswordResets, adminSessions } from "@db/schema";
import { desc, eq, lt } from "drizzle-orm";
import {
  ADMIN_SESSION_TTL_SECONDS,
  LOGIN_BLOCK_MS,
  LOGIN_MAX_FAILURES,
  LOGIN_WINDOW_MS,
  PASSWORD_MIN_LENGTH,
  RESET_CODE_TTL_MS,
  RESET_MAX_ATTEMPTS,
  clearAdminSessionCookie,
  generateResetCode,
  generateSessionToken,
  getAdminSessionToken,
  getBootstrapPassword,
  getLoginIdentifier,
  hashPassword,
  hashResetCode,
  hashSessionToken,
  secureStringEqual,
  setAdminSessionCookie,
  isStrongPassword,
  verifyPassword,
} from "../lib/admin-auth";

function getRetryAfterSeconds(blockedUntil: Date): number {
  return Math.max(1, Math.ceil((blockedUntil.getTime() - Date.now()) / 1000));
}

async function getCredential(db: ReturnType<typeof getDb>) {
  return db.select().from(adminCredentials).limit(1);
}

async function ensureCredential(db: ReturnType<typeof getDb>) {
  const existing = await getCredential(db);
  if (existing.length > 0) return existing[0];

  const bootstrapPassword = getBootstrapPassword();
  if (!bootstrapPassword) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Admin password is not configured. Set ADMIN_PASSWORD before the first login.",
    });
  }

  const passwordHash = await hashPassword(bootstrapPassword);
  await db.insert(adminCredentials).values({ passwordHash });
  const created = await getCredential(db);
  if (created.length === 0) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Admin credentials could not be initialized" });
  }
  return created[0];
}

async function getRateLimitState(db: ReturnType<typeof getDb>, identifier: string) {
  const rows = await db
    .select()
    .from(adminLoginAttempts)
    .where(eq(adminLoginAttempts.identifier, identifier))
    .limit(1);
  const attempt = rows[0];
  if (!attempt) return { blocked: false };

  const now = Date.now();
  if (attempt.blockedUntil && attempt.blockedUntil.getTime() > now) {
    return { blocked: true, retryAfter: getRetryAfterSeconds(attempt.blockedUntil) };
  }

  if (now - attempt.firstFailedAt.getTime() > LOGIN_WINDOW_MS) {
    await db
      .update(adminLoginAttempts)
      .set({ failedCount: 0, firstFailedAt: new Date(), lastAttemptAt: new Date(), blockedUntil: null })
      .where(eq(adminLoginAttempts.id, attempt.id));
    return { blocked: false };
  }

  if (attempt.failedCount >= LOGIN_MAX_FAILURES) {
    const blockedUntil = new Date(Date.now() + LOGIN_BLOCK_MS);
    await db
      .update(adminLoginAttempts)
      .set({ blockedUntil, lastAttemptAt: new Date() })
      .where(eq(adminLoginAttempts.id, attempt.id));
    return { blocked: true, retryAfter: getRetryAfterSeconds(blockedUntil) };
  }

  return { blocked: false };
}

async function recordFailedLogin(db: ReturnType<typeof getDb>, identifier: string): Promise<void> {
  const rows = await db
    .select()
    .from(adminLoginAttempts)
    .where(eq(adminLoginAttempts.identifier, identifier))
    .limit(1);
  const attempt = rows[0];
  const now = new Date();
  const withinWindow = attempt && now.getTime() - attempt.firstFailedAt.getTime() <= LOGIN_WINDOW_MS;
  const failedCount = withinWindow ? attempt.failedCount + 1 : 1;
  const blockedUntil = failedCount >= LOGIN_MAX_FAILURES ? new Date(now.getTime() + LOGIN_BLOCK_MS) : null;

  if (attempt) {
    await db
      .update(adminLoginAttempts)
      .set({ failedCount, firstFailedAt: withinWindow ? attempt.firstFailedAt : now, lastAttemptAt: now, blockedUntil })
      .where(eq(adminLoginAttempts.id, attempt.id));
  } else {
    await db.insert(adminLoginAttempts).values({
      identifier,
      failedCount,
      firstFailedAt: now,
      lastAttemptAt: now,
      blockedUntil,
    });
  }
}

async function clearFailedLogins(db: ReturnType<typeof getDb>, identifier: string): Promise<void> {
  await db.delete(adminLoginAttempts).where(eq(adminLoginAttempts.identifier, identifier));
}

function escapeHtml(value: string): string {
  return value.replace(new RegExp('[&<>"]', 'g'), (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] || char));
}

async function sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!resendKey || !resendFrom) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: resendFrom,
        to: [email],
        subject: 'Your Nazmus Sakib Admin password reset code',
        html: `<p>Use this one-time admin password reset code:</p><p style="font-size:24px;font-weight:700;letter-spacing:6px">${escapeHtml(code)}</p><p>This code expires in 10 minutes and can be used only once. If you did not request it, you can ignore this email.</p>`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export const adminRouter = createAdminRouter({
  login: publicQuery
    .input(z.object({ password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const identifier = getLoginIdentifier(ctx.req);
      const rateLimit = await getRateLimitState(db, identifier);
      if (rateLimit.blocked) {
        return {
          success: false,
          token: null,
          message: `Too many failed attempts. Try again in ${Math.ceil((rateLimit.retryAfter || 60) / 60)} minute(s).`,
        };
      }

      const credential = await ensureCredential(db);
      const valid = await verifyPassword(input.password, credential.passwordHash);
      if (!valid) {
        await recordFailedLogin(db, identifier);
        return { success: false, token: null, message: "Invalid password" };
      }

      await clearFailedLogins(db, identifier);
      await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));

      const rawToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000);
      await db.insert(adminSessions).values({
        token: hashSessionToken(rawToken),
        expiresAt,
      });
      setAdminSessionCookie(ctx.resHeaders, ctx.req.headers, rawToken);

      return { success: true, token: null, message: "Login successful" };
    }),

  requestPasswordReset: publicQuery
    .input(z.object({ email: z.string().email().max(320) }))
    .mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      const db = getDb();
      const genericMessage = "If that email is configured, a one-time code will be sent shortly.";
      const resetIdentifier = `reset:${getLoginIdentifier(ctx.req)}`;
      const rateLimit = await getRateLimitState(db, resetIdentifier);
      if (rateLimit.blocked) return { success: true, message: genericMessage };
      await recordFailedLogin(db, resetIdentifier);
      await db.delete(adminPasswordResets).where(lt(adminPasswordResets.expiresAt, new Date()));

      const configuredEmail = (process.env.ADMIN_EMAIL || process.env.CONTACT_TO_EMAIL || "").trim().toLowerCase();
      const credentials = await getCredential(db);
      if (!configuredEmail || email !== configuredEmail || credentials.length === 0) {
        return { success: true, message: genericMessage };
      }

      const code = generateResetCode();
      const codeHash = hashResetCode(email, code);
      await db.delete(adminPasswordResets).where(eq(adminPasswordResets.email, email));
      await db.insert(adminPasswordResets).values({
        email,
        codeHash,
        expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
        attempts: 0,
      });

      const sent = await sendPasswordResetEmail(email, code);
      if (!sent) {
        await db.delete(adminPasswordResets).where(eq(adminPasswordResets.codeHash, codeHash));
      }
      return { success: true, message: genericMessage };
    }),

  resetPassword: publicQuery
    .input(
      z.object({
        email: z.string().email().max(320),
        code: z.string().regex(/^\d{6}$/, "Reset code must be six digits"),
        newPassword: z.string().min(PASSWORD_MIN_LENGTH),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!isStrongPassword(input.newPassword)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters and contain at least three character types (uppercase, lowercase, number, symbol).`,
        });
      }

      const email = input.email.trim().toLowerCase();
      const db = getDb();
      const rows = await db
        .select()
        .from(adminPasswordResets)
        .where(eq(adminPasswordResets.email, email))
        .orderBy(desc(adminPasswordResets.createdAt))
        .limit(1);
      const reset = rows[0];
      const invalidMessage = "This reset code is invalid or expired.";
      if (!reset || reset.usedAt || reset.expiresAt.getTime() <= Date.now() || reset.attempts >= RESET_MAX_ATTEMPTS) {
        throw new TRPCError({ code: "BAD_REQUEST", message: invalidMessage });
      }

      const expectedHash = hashResetCode(email, input.code);
      if (!secureStringEqual(expectedHash, reset.codeHash)) {
        const attempts = reset.attempts + 1;
        await db
          .update(adminPasswordResets)
          .set({ attempts, ...(attempts >= RESET_MAX_ATTEMPTS ? { usedAt: new Date() } : {}) })
          .where(eq(adminPasswordResets.id, reset.id));
        throw new TRPCError({ code: "BAD_REQUEST", message: invalidMessage });
      }

      const credential = (await getCredential(db))[0];
      if (!credential) {
        throw new TRPCError({ code: "BAD_REQUEST", message: invalidMessage });
      }

      const passwordHash = await hashPassword(input.newPassword);
      await db.update(adminCredentials).set({ passwordHash, updatedAt: new Date() }).where(eq(adminCredentials.id, credential.id));
      await db.delete(adminPasswordResets).where(eq(adminPasswordResets.id, reset.id));
      await db.delete(adminSessions);
      clearAdminSessionCookie(ctx.resHeaders, ctx.req.headers);
      return { success: true, message: "Password reset successfully. Please log in again." };
    }),

  verify: adminProcedure.query(async () => {
    return { authenticated: true };
  }),

  changePassword: adminProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(PASSWORD_MIN_LENGTH),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!isStrongPassword(input.newPassword)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters and contain at least three character types (uppercase, lowercase, number, symbol).`,
        });
      }
      if (input.currentPassword === input.newPassword) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "New password must be different from the current password" });
      }

      const db = getDb();
      const credentials = await getCredential(db);
      const credential = credentials[0];
      if (!credential || !(await verifyPassword(input.currentPassword, credential.passwordHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      }

      const passwordHash = await hashPassword(input.newPassword);
      await db.update(adminCredentials).set({ passwordHash, updatedAt: new Date() }).where(eq(adminCredentials.id, credential.id));
      await db.delete(adminSessions);
      clearAdminSessionCookie(ctx.resHeaders, ctx.req.headers);
      return { success: true, message: "Password changed. Please log in again on each device." };
    }),

  logoutAll: adminProcedure.mutation(async ({ ctx }) => {
    const db = getDb();
    await db.delete(adminSessions);
    clearAdminSessionCookie(ctx.resHeaders, ctx.req.headers);
    return { success: true };
  }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    const rawToken = getAdminSessionToken(ctx.req);
    if (rawToken) {
      const db = getDb();
      await db.delete(adminSessions).where(eq(adminSessions.token, hashSessionToken(rawToken)));
    }
    clearAdminSessionCookie(ctx.resHeaders, ctx.req.headers);
    return { success: true };
  }),

  securityStatus: adminProcedure.query(async () => {
    const db = getDb();
    const credentials = await getCredential(db);
    return {
      passwordConfigured: credentials.length > 0,
      sessionHours: ADMIN_SESSION_TTL_SECONDS / 3600,
      maxLoginFailures: LOGIN_MAX_FAILURES,
      loginWindowMinutes: LOGIN_WINDOW_MS / 60000,
      recoveryEmailConfigured: Boolean((process.env.ADMIN_EMAIL || process.env.CONTACT_TO_EMAIL || '').trim()),
    };
  }),
});
