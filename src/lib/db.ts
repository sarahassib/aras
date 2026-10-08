import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not defined. Copy .env.example to .env and configure it.",
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient = globalForPrisma.prisma ?? createClient(url);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export function createDb(databaseUrl: string): PrismaClient {
  return createClient(databaseUrl);
}
