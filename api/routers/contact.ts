import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { contactMessages } from "@db/schema";
import { desc, eq } from "drizzle-orm";

// Naive in-memory rate limit: max 5 messages per IP per 10 minutes
const rateMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function escapeHtml(value: string) {
  return value.replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[char] || char));
}

function checkRate(key: string) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_PER_WINDOW;
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
      const ip =
        ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        ctx.req.headers.get("x-real-ip") ||
        "unknown";
      if (!checkRate(ip)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many messages. Please try again later.",
        });
      }
      const db = getDb();
      await db.insert(contactMessages).values({
        name: input.name,
        email: input.email,
        subject: input.subject || null,
        message: input.message,
      });

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
              html: `<h2>New portfolio contact</h2><p><strong>Name:</strong> ${escapeHtml(input.name)}</p><p><strong>Email:</strong> ${escapeHtml(input.email)}</p><p><strong>Message:</strong></p><p>${escapeHtml(input.message).replace(/\n/g, '<br />')}</p>`,
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

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(contactMessages).where(eq(contactMessages.id, input.id));
      return { success: true };
    }),
});
