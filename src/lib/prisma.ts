import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type GlobalPrismaCache = typeof globalThis & {
  prisma_new?: PrismaClient;
  prisma_pool?: Pool;
  prisma_adapter?: PrismaPg;
};

const cacheBusterPrisma = globalThis as GlobalPrismaCache;

// En Vercel siempre usaremos la variable de entorno DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL");
}

const pool =
  cacheBusterPrisma.prisma_pool ||
  new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  });

const adapter =
  cacheBusterPrisma.prisma_adapter || new PrismaPg(pool);

export const prisma =
  cacheBusterPrisma.prisma_new ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  cacheBusterPrisma.prisma_pool = pool;
  cacheBusterPrisma.prisma_adapter = adapter;
  cacheBusterPrisma.prisma_new = prisma;
}
