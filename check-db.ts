import mysql from "mysql2/promise";
import "dotenv/config";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const [rows] = await conn.execute("SHOW TABLES");
  console.log("Tables:", rows);
  await conn.end();
}

main().catch(console.error);
