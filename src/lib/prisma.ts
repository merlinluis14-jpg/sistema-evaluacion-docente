import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const cacheBusterPrisma = global as unknown as { prisma_new: PrismaClient };

// En Vercel siempre usaremos la variable de entorno DATABASE_URL
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: 10,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);

export const prisma =
  cacheBusterPrisma.prisma_new ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") cacheBusterPrisma.prisma_new = prisma;