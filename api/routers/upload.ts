import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createAdminRouter, adminProcedure } from "./admin-middleware";
import { getDb } from "../queries/connection";
import { uploads } from "@db/schema";
import { desc, eq } from "drizzle-orm";

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
];

// ~12MB of base64 ≈ 9MB binary
const MAX_BASE64_LENGTH = 12 * 1024 * 1024;

export const uploadAdminRouter = createAdminRouter({
  upload: adminProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(500),
        mimeType: z.string().min(1).max(100),
        dataBase64: z.string().min(1).max(MAX_BASE64_LENGTH),
      })
    )
    .mutation(async ({ input }) => {
      if (!ALLOWED_MIME.includes(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported file type: ${input.mimeType}`,
        });
      }
      const size = Math.floor(input.dataBase64.length * 0.75);
      const db = getDb();
      const [result] = await db.insert(uploads).values({
        filename: input.filename,
        mimeType: input.mimeType,
        size,
        data: input.dataBase64,
      }).returning({ id: uploads.id });
      const id = Number(result.id);
      return { success: true, id, url: `/api/files/${id}` };
    }),

  list: adminProcedure.query(async () => {
    const db = getDb();
    // Never fetch the base64 payloads when listing
    return db
      .select({
        id: uploads.id,
        filename: uploads.filename,
        mimeType: uploads.mimeType,
        size: uploads.size,
        createdAt: uploads.createdAt,
      })
      .from(uploads)
      .orderBy(desc(uploads.createdAt));
  }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(uploads).where(eq(uploads.id, input.id));
      return { success: true };
    }),
});
