import 'dotenv/config';
import mysql from 'mysql2/promise';
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.query("SELECT `key`, `value` FROM `site_settings` WHERE `key` IN ('aiProvider','aiApiUrl','aiModel','aiApiKey')");
  for (const row of rows) {
    const value = String(row.value ?? '');
    console.log(`${row.key}=${row.key === 'aiApiKey' ? `present:${value.length}` : value}`);
  }
} finally {
  await connection.end();
}
