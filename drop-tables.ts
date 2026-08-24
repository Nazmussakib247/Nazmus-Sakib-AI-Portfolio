import { getDb } from "./api/queries/connection";
import { sql } from "drizzle-orm";

async function main() {
  const db = getDb();
  await db.execute(sql`DROP TABLE IF EXISTS admin_sessions, writings, awards, experiences, certificates, projects, profiles`);
  console.log("Tables dropped");
}

main().catch(console.error);
