import { drizzle, type NodePgClient } from "drizzle-orm/node-postgres";
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
    // pg-connection-string lets sslmode=require override Pool.ssl. Remove
    // those URL flags so the explicit policy below is authoritative even if
    // Render still has an older Supabase URL saved in its environment.
    const databaseUrl = new URL(env.databaseUrl);
    databaseUrl.searchParams.delete("sslmode");
    databaseUrl.searchParams.delete("uselibpqcompat");
    const pool = new Pool({
      connectionString: databaseUrl.toString(),
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
    instance = drizzle(pool as unknown as NodePgClient, {
      schema: fullSchema,
    });
  }
  return instance;
}
