import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
export const isPersistentDatabaseConfigured =
  !process.env.VERCEL || !databaseUrl.startsWith("file:");

const adapter = new PrismaLibSql({
  url: databaseUrl,
  authToken:
    process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN,
});

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
