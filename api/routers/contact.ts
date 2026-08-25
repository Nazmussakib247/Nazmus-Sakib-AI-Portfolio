import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { blockedContactIps, contactMessages, contactRateLimits } from "@db/schema";
import { desc, eq } from "drizzle-orm";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function escapeHtml(value: string) {
  return value.replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[char] || char));
}

async function checkRate(db: ReturnType<typeof getDb>, ipAddress: string) {
  const now = new Date();
  const rows = await db.select().from(contactRateLimits).where(eq(contactRateLimits.ipAddress, ipAddress)).limit(1);
  const current = rows[0];

  if (!current || now.getTime() - current.windowStartedAt.getTime() >= WINDOW_MS) {
    await db.insert(contactRateLimits).values({ ipAddress, windowStartedAt: now, messageCount: 1, updatedAt: now }).onConflictDoUpdate({
      target: contactRateLimits.ipAddress,
      set: { windowStartedAt: now, messageCount: 1, updatedAt: now },
    });
    return true;
  }

  if (current.messageCount >= MAX_PER_WINDOW) return false;
  await db.update(contactRateLimits).set({ messageCount: current.messageCount + 1, updatedAt: now }).where(eq(contactRateLimits.ipAddress, ipAddress));
  return true;
}

function parseUserAgent(userAgent: string) {
  const deviceType = /tablet|ipad|playbook|silk/i.test(userAgent)
    ? 'Tablet'
    : /mobile|iphone|android.*mobile|windows phone/i.test(userAgent)
      ? 'Mobile'
      : 'Desktop';

  const browser = /edg\//i.test(userAgent)
    ? 'Edge'
    : /opr\//i.test(userAgent)
      ? 'Opera'
      : /chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)
        ? 'Chrome'
        : /firefox\//i.test(userAgent)
          ? 'Firefox'
          : /safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)
            ? 'Safari'
            : /googlebot|bingbot|duckduckbot/i.test(userAgent)
              ? 'Bot'
              : 'Other';

  const operatingSystem = /windows/i.test(userAgent)
    ? 'Windows'
    : /android/i.test(userAgent)
      ? 'Android'
      : /iphone|ipad|ipod/i.test(userAgent)
        ? 'iOS'
        : /mac os x/i.test(userAgent)
          ? 'macOS'
          : /linux/i.test(userAgent)
            ? 'Linux'
            : 'Other';

  return { deviceType, browser, operatingSystem };
}

function getClientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    'unknown'
  ).slice(0, 128);
}

export const contactRouter = createRouter({
  send: publicQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(320),
        subject: z.string().max(500).optional(),
        message: z.string().min(5).max(5000),
        // honeypot field — bots fill it, humans never see it
        website: z.string().max(0).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.website) {
        // Silently accept honeypot submissions
        return { success: true };
      }
      const rawIp = getClientIp(ctx.req);
      const ipAddress = rawIp === 'unknown' ? null : rawIp;
      const rawUserAgent = ctx.req.headers.get('user-agent')?.trim() || null;
      const userAgent = rawUserAgent?.slice(0, 500) || null;
      const parsedAgent = userAgent ? parseUserAgent(userAgent) : { deviceType: null, browser: null, operatingSystem: null };
      const db = getDb();

      // Abuse-control tables are deployed separately from the contact table. If
      // their migration is pending, never block a legitimate message or expose
      // the database error to the visitor; metadata simply remains unavailable.
      if (ipAddress) {
        try {
          const blocked = await db.select({ id: blockedContactIps.id }).from(blockedContactIps).where(eq(blockedContactIps.ipAddress, ipAddress)).limit(1);
          if (blocked.length) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Messages from this address are not accepted." });
          }
          if (!(await checkRate(db, ipAddress))) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many messages. Please try again later." });
          }
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error('[contact] abuse-control metadata unavailable:', error);
        }
      }

      let savedMessageId: number;
      try {
        // Always write the legacy-safe fields first. This keeps contact delivery
        // working while metadata migrations are rolling out independently.
        const [savedMessage] = await db.insert(contactMessages).values({
          name: input.name,
          email: input.email,
          subject: input.subject || null,
          message: input.message,
        }).returning({ id: contactMessages.id });
        savedMessageId = savedMessage.id;
      } catch (error) {
        console.error('[contact] message persistence failed:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to send your message right now. Please try again later." });
      }

      // Enrich the saved message when the optional metadata columns exist. A
      // missing migration must never roll back or hide the original message.
      if (savedMessageId && (ipAddress || userAgent || parsedAgent.deviceType || parsedAgent.browser || parsedAgent.operatingSystem)) {
        try {
          await db.update(contactMessages).set({
            ipAddress,
            userAgent,
            deviceType: parsedAgent.deviceType,
            browser: parsedAgent.browser,
            operatingSystem: parsedAgent.operatingSystem,
          }).where(eq(contactMessages.id, savedMessageId));
        } catch (metadataPersistenceError) {
          console.error('[contact] optional metadata unavailable:', metadataPersistenceError);
        }
      }

      let emailSent = false;
      const resendKey = process.env.RESEND_API_KEY?.trim();
      const contactTo = process.env.CONTACT_TO_EMAIL?.trim();
      const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
      if (resendKey && contactTo && resendFrom) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: resendFrom,
              to: [contactTo],
              reply_to: input.email,
              subject: input.subject || `Portfolio message from ${input.name}`,
              html: `<h2>New portfolio contact</h2><p><strong>Name:</strong> ${escapeHtml(input.name)}</p><p><strong>Email:</strong> ${escapeHtml(input.email)}</p>${userAgent ? `<p><strong>Device:</strong> ${escapeHtml(parsedAgent.deviceType || 'Unknown')} · ${escapeHtml(parsedAgent.browser || 'Unknown')} · ${escapeHtml(parsedAgent.operatingSystem || 'Unknown')}</p>` : ''}${ipAddress ? `<p><strong>IP:</strong> ${escapeHtml(ipAddress)}</p>` : ''}<p><strong>Message:</strong></p><p>${escapeHtml(input.message).replace(/\n/g, '<br />')}</p>`,
            }),
            signal: AbortSignal.timeout(10000),
          });
          emailSent = emailResponse.ok;
        } catch {
          emailSent = false;
        }
      }
      return { success: true, emailSent };
    }),
});

export const contactAdminRouter = createAdminRouter({
  list: adminProcedure.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }),

  unreadCount: adminProcedure.query(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.isRead, false));
    return { count: rows.length };
  }),

  markRead: adminProcedure
    .input(z.object({ id: z.number(), isRead: z.boolean().default(true) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(contactMessages)
        .set({ isRead: input.isRead })
        .where(eq(contactMessages.id, input.id));
      return { success: true };
    }),

  toggleSpam: adminProcedure
    .input(z.object({ id: z.number(), isSpam: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(contactMessages).set({ isSpam: input.isSpam }).where(eq(contactMessages.id, input.id));
      return { success: true };
    }),
  listBlockedIps: adminProcedure.query(async () => {
    const db = getDb();
    return db.select().from(blockedContactIps).orderBy(desc(blockedContactIps.blockedAt));
  }),
  blockIp: adminProcedure
    .input(z.object({ ipAddress: z.string().min(1).max(128), note: z.string().max(255).optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(blockedContactIps).values({ ipAddress: input.ipAddress, note: input.note || null }).onConflictDoNothing();
      return { success: true };
    }),
  unblockIp: adminProcedure
    .input(z.object({ ipAddress: z.string().min(1).max(128) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(blockedContactIps).where(eq(blockedContactIps.ipAddress, input.ipAddress));
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(contactMessages).where(eq(contactMessages.id, input.id));
      return { success: true };
    }),
});
