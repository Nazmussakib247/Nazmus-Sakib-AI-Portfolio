import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { profiles } from "@db/schema";
import { eq } from "drizzle-orm";
import { cleanPlatformLinks, ensureProfilePlatformLinksColumn, platformLinksSchema } from "../lib/profile";

export const profileRouter = createRouter({
  get: publicQuery.query(async () => {
    const db = getDb();
    await ensureProfilePlatformLinksColumn(db);
    const rows = await db.select().from(profiles).limit(1);
    return rows[0] || null;
  }),
});

export const profileAdminRouter = createAdminRouter({
  update: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        title: z.string().min(1),
        bio: z.string().min(1),
        avatarUrl: z.string().optional(),
        cvUrl: z.string().optional(),
        email: z.string().email().optional(),
        githubUrl: z.string().optional(),
        linkedinUrl: z.string().optional(),
        mediumUrl: z.string().optional(),
        platformLinks: platformLinksSchema.optional(),
        location: z.string().optional(),
        age: z.number().optional(),
        university: z.string().optional(),
        department: z.string().optional(),
        semester: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await ensureProfilePlatformLinksColumn(db);
      const values = { ...input, platformLinks: cleanPlatformLinks(input.platformLinks as Record<string, string | undefined> | undefined), updatedAt: new Date() };
      const existing = await db.select().from(profiles).limit(1);

      if (existing.length > 0) {
        await db
          .update(profiles)
          .set(values)
          .where(eq(profiles.id, existing[0].id));
        return { success: true, id: existing[0].id };
      } else {
        const [result] = await db.insert(profiles).values(values).returning({ id: profiles.id });
        return { success: true, id: Number(result.id) };
      }
    }),
});
