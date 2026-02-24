import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const cacheBusterPrisma = global as unknown as { prisma_new: PrismaClient };

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:UPTXAdmin2026@db.cbxlkfjemljkrovtobxr.supabase.co:6543/postgres?pgbouncer=true";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  cacheBusterPrisma.prisma_new ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") cacheBusterPrisma.prisma_new = prisma;