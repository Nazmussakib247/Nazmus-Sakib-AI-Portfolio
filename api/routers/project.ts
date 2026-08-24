import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { projects } from "@db/schema";
import { eq } from "drizzle-orm";

const architectureNode = z.object({ id: z.string().min(1), label: z.string().min(1), detail: z.string().optional(), orderIndex: z.number().int().nonnegative() });
const decision = z.object({ title: z.string().min(1), decision: z.string().min(1), tradeoff: z.string().min(1), orderIndex: z.number().int().nonnegative() });
const metric = z.object({ label: z.string().min(1), value: z.string().min(1), unit: z.string().optional(), context: z.string().min(1), sourceNote: z.string().optional(), isVerified: z.boolean(), orderIndex: z.number().int().nonnegative() });
const media = z.object({ url: z.string().url().or(z.string().startsWith("/")), altText: z.string().min(1), caption: z.string().min(1), kind: z.enum(["overview", "workflow", "analysis", "architecture"]), orderIndex: z.number().int().nonnegative(), thumbnailUrl: z.string().optional() });
const caseStudyLink = z.object({ label: z.string().min(1), url: z.string().url(), kind: z.string().optional(), orderIndex: z.number().int().nonnegative() });

const caseStudyFields = {
  slug: z.string().min(1).max(255).optional(),
  caseStudyEnabled: z.boolean().optional(),
  caseStudySummary: z.string().optional(),
  problemStatement: z.string().optional(),
  roleDescription: z.string().optional(),
  architectureSummary: z.string().optional(),
  outcomeSummary: z.string().optional(),
  lessonsLearned: z.string().optional(),
  caseStudyOrder: z.number().int().nonnegative().optional(),
  caseStudyArchitecture: z.array(architectureNode).optional(),
  caseStudyDecisions: z.array(decision).optional(),
  caseStudyMetrics: z.array(metric).optional(),
  caseStudyMedia: z.array(media).optional(),
  caseStudyLinks: z.array(caseStudyLink).optional(),
  caseStudyStack: z.array(z.string()).optional(),
};

const baseProjectFields = {
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  techStack: z.array(z.string()).optional(),
  thumbnailUrl: z.string().optional(),
  githubUrl: z.string().nullable().optional(),
  liveUrl: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  screenshots: z.array(z.string()).optional(),
  orderIndex: z.number().int().optional(),
  isFeatured: z.boolean().optional(),
};

export const projectRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(projects).orderBy(projects.orderIndex);
  }),
  getById: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const rows = await db.select().from(projects).where(eq(projects.id, input.id)).limit(1);
    return rows[0] || null;
  }),
  getCaseStudyBySlug: publicQuery.input(z.object({ slug: z.string().min(1) })).query(async ({ input }) => {
    const db = getDb();
    const rows = await db.select().from(projects).where(eq(projects.slug, input.slug)).limit(1);
    const project = rows[0] || null;
    return project?.caseStudyEnabled ? project : null;
  }),
});

export const projectAdminRouter = createAdminRouter({
  create: adminProcedure.input(z.object({ title: z.string().min(1), description: z.string().min(1), techStack: z.array(z.string()).optional(), thumbnailUrl: z.string().optional(), githubUrl: z.string().nullable().optional(), liveUrl: z.string().nullable().optional(), videoUrl: z.string().nullable().optional(), screenshots: z.array(z.string()).optional(), orderIndex: z.number().default(0), isFeatured: z.boolean().default(true), ...caseStudyFields })).mutation(async ({ input }) => {
    const db = getDb();
    const [result] = await db.insert(projects).values({ ...input, techStack: input.techStack || [], screenshots: input.screenshots || [], caseStudyArchitecture: input.caseStudyArchitecture || [], caseStudyDecisions: input.caseStudyDecisions || [], caseStudyMetrics: input.caseStudyMetrics || [], caseStudyMedia: input.caseStudyMedia || [], caseStudyLinks: input.caseStudyLinks || [], caseStudyStack: input.caseStudyStack || [] }).returning({ id: projects.id });
    return { success: true, id: Number(result.id) };
  }),
  update: adminProcedure.input(z.object({ id: z.number(), ...baseProjectFields, ...caseStudyFields })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const db = getDb();
    await db.update(projects).set({ ...data, updatedAt: new Date() }).where(eq(projects.id, id));
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(projects).where(eq(projects.id, input.id));
    return { success: true };
  }),
});
