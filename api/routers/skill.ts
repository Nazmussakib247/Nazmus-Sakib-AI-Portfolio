import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { skills } from "@db/schema";
import { eq } from "drizzle-orm";
import { recordEntityChange, snapshotSkill } from "./change-log";

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
      const id = Number(result.id);
      await recordEntityChange("skill", id, "create", null, await snapshotSkill(id), `Created skill #${id}`);
      return { success: true, id };
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
      const before = await snapshotSkill(id);
      const db = getDb();
      await db
        .update(skills)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(skills.id, id));
      await recordEntityChange("skill", id, "update", before, await snapshotSkill(id), `Updated skill #${id}`);
      return { success: true };
    }),

  reorder: adminProcedure
    .input(z.array(z.object({ id: z.number(), orderIndex: z.number() })))
    .mutation(async ({ input }) => {
      const before = await Promise.all(input.map((item) => snapshotSkill(item.id)));
      const db = getDb();
      for (const item of input) {
        await db
          .update(skills)
          .set({ orderIndex: item.orderIndex })
          .where(eq(skills.id, item.id));
      }
      const after = await Promise.all(input.map((item) => snapshotSkill(item.id)));
      await recordEntityChange("skill", null, "reorder", before, after, `Reordered ${input.length} skills`);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const before = await snapshotSkill(input.id);
      const db = getDb();
      await db.delete(skills).where(eq(skills.id, input.id));
      await recordEntityChange("skill", input.id, "delete", before, null, `Deleted skill #${input.id}`);
      return { success: true };
    }),
});
