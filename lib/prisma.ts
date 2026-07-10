import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
    // better-sqlite3 busy timeout: wait instead of failing with SQLITE_BUSY
    // when another connection holds the write lock.
    timeout: 5000,
  });
  const client = new PrismaClient({ adapter });
  // WAL allows concurrent readers while a write is in progress.
  client.$queryRawUnsafe("PRAGMA journal_mode=WAL;").catch(() => {});
  return client;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
