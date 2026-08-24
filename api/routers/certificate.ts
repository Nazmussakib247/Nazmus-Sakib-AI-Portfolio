import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { certificates } from "@db/schema";
import { asc, eq } from "drizzle-orm";

const certificateInput = z.object({
  title: z.string().min(1),
  issuer: z.string().min(1),
  category: z.string().trim().min(1).max(100).default("General"),
  thumbnailUrl: z.string().optional(),
  credentialUrl: z.string().optional(),
  skillsGained: z.array(z.string()).optional(),
  description: z.string().optional(),
  issueDate: z.string().optional(),
  orderIndex: z.number().int().default(0),
});

export const certificateRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(certificates).orderBy(asc(certificates.orderIndex), asc(certificates.id));
  }),
});

export const certificateAdminRouter = createAdminRouter({
  create: adminProcedure
    .input(certificateInput)
    .mutation(async ({ input }) => {
      const db = getDb();
      const data: Record<string, unknown> = {
        title: input.title,
        issuer: input.issuer,
        category: input.category,
        thumbnailUrl: input.thumbnailUrl,
        credentialUrl: input.credentialUrl,
        skillsGained: input.skillsGained || [],
        description: input.description,
        orderIndex: input.orderIndex,
        updatedAt: new Date(),
      };
      if (input.issueDate) data.issueDate = new Date(input.issueDate);
      const result = await db.insert(certificates).values(data as typeof certificates.$inferInsert);
      return { success: true, id: Number(result[0].insertId) };
    }),

  update: adminProcedure
    .input(
      certificateInput.partial().extend({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, issueDate, ...rest } = input;
      const db = getDb();
      const data: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (issueDate) data.issueDate = new Date(issueDate);
      await db.update(certificates).set(data as typeof certificates.$inferInsert).where(eq(certificates.id, id));
      return { success: true };
    }),

  reorder: adminProcedure
    .input(z.object({ id: z.number(), orderIndex: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(certificates).set({ orderIndex: input.orderIndex, updatedAt: new Date() }).where(eq(certificates.id, input.id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(certificates).where(eq(certificates.id, input.id));
      return { success: true };
    }),
});
