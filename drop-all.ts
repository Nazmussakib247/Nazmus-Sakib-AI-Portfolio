import mysql from "mysql2/promise";
import "dotenv/config";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  await conn.execute("SET FOREIGN_KEY_CHECKS = 0");
  await conn.execute("DROP TABLE IF EXISTS admin_sessions");
  await conn.execute("DROP TABLE IF EXISTS writings");
  await conn.execute("DROP TABLE IF EXISTS awards");
  await conn.execute("DROP TABLE IF EXISTS experiences");
  await conn.execute("DROP TABLE IF EXISTS certificates");
  await conn.execute("DROP TABLE IF EXISTS projects");
  await conn.execute("DROP TABLE IF EXISTS profiles");
  await conn.execute("DROP TABLE IF EXISTS users");
  await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
  console.log("All tables dropped");
  await conn.end();
}

main().catch(console.error);
