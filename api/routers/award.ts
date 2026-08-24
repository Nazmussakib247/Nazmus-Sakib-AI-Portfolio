import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { awards } from "@db/schema";
import { eq } from "drizzle-orm";

export const awardRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(awards).orderBy(awards.orderIndex);
  }),
});

export const awardAdminRouter = createAdminRouter({
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        eyebrow: z.string().optional(),
        image: z.string().optional(),
        imageAlt: z.string().optional(),
        sourceUrl: z.string().optional(),
        sourceLabel: z.string().optional(),
        iconName: z.string().default("award"),
        orderIndex: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(awards).values(input).returning({ id: awards.id });
      return { success: true, id: Number(result.id) };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        eyebrow: z.string().optional(),
        image: z.string().optional(),
        imageAlt: z.string().optional(),
        sourceUrl: z.string().optional(),
        sourceLabel: z.string().optional(),
        iconName: z.string().optional(),
        orderIndex: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db
        .update(awards)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(awards.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(awards).where(eq(awards.id, input.id));
      return { success: true };
    }),
});
