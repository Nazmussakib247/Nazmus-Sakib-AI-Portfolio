import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    // Supabase’s pooler certificate chain is not trusted by every Render
    // runtime image. Keep transport encryption enabled, while allowing the
    // deployment to opt out of CA verification explicitly for this staging
    // connection via PGSSL_REJECT_UNAUTHORIZED=false.
    const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== "false";
    const pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: { rejectUnauthorized },
    });
    pool.on("error", (error) => {
      const details = error as Error & { code?: string };
      console.error("[db] PostgreSQL pool error", {
        name: details.name,
        code: details.code,
        message: details.message,
      });
    });
    void pool
      .query("select 1 as ok")
      .then(() => console.info("[db] PostgreSQL connectivity check passed"))
      .catch((error) => {
        const details = error as Error & { code?: string };
        console.error("[db] PostgreSQL connectivity check failed", {
          name: details.name,
          code: details.code,
          message: details.message,
        });
      });
    // Drizzle's node-postgres generics are narrower than the installed
    // @types/pg QueryResult union; the runtime Pool is compatible, so keep
    // the application schema inference at the Drizzle boundary.
    instance = drizzle(pool as any, {
      schema: fullSchema,
    });
  }
  return instance;
}
