import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { experiences } from "@db/schema";
import { eq } from "drizzle-orm";

export const experienceRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(experiences).orderBy(experiences.orderIndex);
  }),
});

export const experienceAdminRouter = createAdminRouter({
  create: adminProcedure
    .input(
      z.object({
        type: z.enum(["education", "work", "internship"]),
        title: z.string().min(1),
        organization: z.string().min(1),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
        orderIndex: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(experiences).values(input).returning({ id: experiences.id });
      return { success: true, id: Number(result.id) };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        type: z.enum(["education", "work", "internship"]).optional(),
        title: z.string().min(1).optional(),
        organization: z.string().min(1).optional(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
        orderIndex: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db
        .update(experiences)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(experiences.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(experiences).where(eq(experiences.id, input.id));
      return { success: true };
    }),
});
