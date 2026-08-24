import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { skills } from "@db/schema";
import { eq } from "drizzle-orm";

export const skillRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(skills).orderBy(skills.orderIndex, skills.id);
  }),
});

export const skillAdminRouter = createAdminRouter({
  create: adminProcedure
    .input(
      z.object({
        category: z.string().min(1),
        iconName: z.string().default("code"),
        iconUrl: z.string().optional(),
        name: z.string().min(1),
        level: z.number().min(0).max(100).default(80),
        orderIndex: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(skills).values(input).returning({ id: skills.id });
      return { success: true, id: Number(result.id) };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        category: z.string().min(1).optional(),
        iconName: z.string().optional(),
        iconUrl: z.string().optional(),
        name: z.string().min(1).optional(),
        level: z.number().min(0).max(100).optional(),
        orderIndex: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db
        .update(skills)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(skills.id, id));
      return { success: true };
    }),

  reorder: adminProcedure
    .input(z.array(z.object({ id: z.number(), orderIndex: z.number() })))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const item of input) {
        await db
          .update(skills)
          .set({ orderIndex: item.orderIndex })
          .where(eq(skills.id, item.id));
      }
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(skills).where(eq(skills.id, input.id));
      return { success: true };
    }),
});
