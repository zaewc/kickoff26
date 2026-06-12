import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
if (databaseUrl.startsWith("file:")) {
  const databasePath = path.resolve(process.cwd(), databaseUrl.slice(5));
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

const database = createClient({
  url: databaseUrl,
  authToken:
    process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN,
});

await database.executeMultiple(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS "_app_migrations" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const migrationsRoot = path.resolve(process.cwd(), "prisma/migrations");
const migrations = fs
  .readdirSync(migrationsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const name of migrations) {
  const applied = await database.execute({
    sql: 'SELECT 1 FROM "_app_migrations" WHERE "name" = ?',
    args: [name],
  });
  if (applied.rows.length) continue;

  const sql = fs.readFileSync(
    path.join(migrationsRoot, name, "migration.sql"),
    "utf8",
  );
  const transaction = await database.transaction("write");
  try {
    await transaction.executeMultiple(sql);
    await transaction.execute({
      sql: 'INSERT INTO "_app_migrations" ("name") VALUES (?)',
      args: [name],
    });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  console.log(`Applied migration: ${name}`);
}

database.close();
