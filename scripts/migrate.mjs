import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
if (!databaseUrl.startsWith("file:")) {
  throw new Error("The bundled migration runner only supports file: SQLite URLs.");
}

const databasePath = path.resolve(process.cwd(), databaseUrl.slice(5));
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
database.exec(`
  CREATE TABLE IF NOT EXISTS "_app_migrations" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const migrationsRoot = path.resolve(process.cwd(), "prisma/migrations");
const migrations = fs
  .readdirSync(migrationsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const applied = database.prepare(
  'SELECT 1 FROM "_app_migrations" WHERE "name" = ?',
);
const record = database.prepare(
  'INSERT INTO "_app_migrations" ("name") VALUES (?)',
);

for (const name of migrations) {
  if (applied.get(name)) continue;

  const sql = fs.readFileSync(
    path.join(migrationsRoot, name, "migration.sql"),
    "utf8",
  );
  database.transaction(() => {
    database.exec(sql);
    record.run(name);
  })();
  console.log(`Applied migration: ${name}`);
}

database.close();
