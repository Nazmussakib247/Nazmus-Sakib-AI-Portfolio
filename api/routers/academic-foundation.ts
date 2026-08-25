import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import {
  academicFoundationCategories,
  academicFoundationCourses,
} from "@db/schema";
import { ensureAcademicFoundationTables } from "../lib/academic-foundation";

const categoryInput = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  orderIndex: z.number().int().default(0),
  isVisible: z.boolean().default(true),
});

const courseInput = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(1).max(255),
  shortDescription: z.string().trim().max(2000).optional(),
  relatedProject: z.string().trim().max(255).optional(),
  relatedProjectId: z.number().int().positive().nullable().optional(),
  orderIndex: z.number().int().default(0),
  isFeatured: z.boolean().default(false),
  isVisible: z.boolean().default(true),
});

async function getFoundationRows(includeHidden: boolean) {
  await ensureAcademicFoundationTables();
  const db = getDb();
  const categories = await db
    .select()
    .from(academicFoundationCategories)
    .orderBy(asc(academicFoundationCategories.orderIndex), asc(academicFoundationCategories.id));
  const courses = await db
    .select()
    .from(academicFoundationCourses)
    .orderBy(asc(academicFoundationCourses.orderIndex), asc(academicFoundationCourses.id));
  const visibleCategories = includeHidden ? categories : categories.filter((category) => category.isVisible);
  const visibleCategoryIds = new Set(visibleCategories.map((category) => category.id));
  const visibleCourses = includeHidden
    ? courses
    : courses.filter((course) => course.isVisible && visibleCategoryIds.has(course.categoryId));

  return visibleCategories.map((category) => ({
    ...category,
    courses: visibleCourses.filter((course) => course.categoryId === category.id),
  }));
}

export const academicFoundationRouter = createRouter({
  list: publicQuery.query(() => getFoundationRows(false)),
});

export const academicFoundationAdminRouter = createAdminRouter({
  list: adminProcedure.query(() => getFoundationRows(true)),

  createCategory: adminProcedure.input(categoryInput).mutation(async ({ input }) => {
    await ensureAcademicFoundationTables();
    const db = getDb();
    const [row] = await db.insert(academicFoundationCategories).values({
      ...input,
      description: input.description || null,
      updatedAt: new Date(),
    }).returning({ id: academicFoundationCategories.id });
    return { success: true, id: Number(row.id) };
  }),

  updateCategory: adminProcedure.input(categoryInput.partial().extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    await ensureAcademicFoundationTables();
    const { id, ...values } = input;
    const db = getDb();
    await db.update(academicFoundationCategories).set({ ...values, updatedAt: new Date() }).where(eq(academicFoundationCategories.id, id));
    return { success: true };
  }),

  reorderCategory: adminProcedure.input(z.object({ id: z.number().int().positive(), orderIndex: z.number().int() })).mutation(async ({ input }) => {
    await ensureAcademicFoundationTables();
    const db = getDb();
    await db.update(academicFoundationCategories).set({ orderIndex: input.orderIndex, updatedAt: new Date() }).where(eq(academicFoundationCategories.id, input.id));
    return { success: true };
  }),

  deleteCategory: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    await ensureAcademicFoundationTables();
    const db = getDb();
    const existing = await db.select({ id: academicFoundationCourses.id }).from(academicFoundationCourses).where(eq(academicFoundationCourses.categoryId, input.id)).limit(1);
    if (existing.length > 0) throw new Error("Delete or move the courses in this category first.");
    await db.delete(academicFoundationCategories).where(eq(academicFoundationCategories.id, input.id));
    return { success: true };
  }),

  createCourse: adminProcedure.input(courseInput).mutation(async ({ input }) => {
    await ensureAcademicFoundationTables();
    const db = getDb();
    const [row] = await db.insert(academicFoundationCourses).values({
      ...input,
      shortDescription: input.shortDescription || null,
      relatedProject: input.relatedProject || null,
      relatedProjectId: input.relatedProjectId ?? null,
      updatedAt: new Date(),
    }).returning({ id: academicFoundationCourses.id });
    return { success: true, id: Number(row.id) };
  }),

  updateCourse: adminProcedure.input(courseInput.partial().extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    await ensureAcademicFoundationTables();
    const { id, ...values } = input;
    const db = getDb();
    await db.update(academicFoundationCourses).set({ ...values, updatedAt: new Date() }).where(eq(academicFoundationCourses.id, id));
    return { success: true };
  }),

  reorderCourse: adminProcedure.input(z.object({ id: z.number().int().positive(), orderIndex: z.number().int() })).mutation(async ({ input }) => {
    await ensureAcademicFoundationTables();
    const db = getDb();
    await db.update(academicFoundationCourses).set({ orderIndex: input.orderIndex, updatedAt: new Date() }).where(eq(academicFoundationCourses.id, input.id));
    return { success: true };
  }),

  deleteCourse: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    await ensureAcademicFoundationTables();
    const db = getDb();
    await db.delete(academicFoundationCourses).where(eq(academicFoundationCourses.id, input.id));
    return { success: true };
  }),
});
