import { config } from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

config();

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "OK" : "NO ENCONTRADA");
console.log("La URL inicia con:", process.env.DATABASE_URL?.slice(0, 30));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

try {
  const users = await prisma.user.count();
  const students = await prisma.student.count();
  console.log("Conexion OK");
  console.log("Usuarios:", users);
  console.log("Alumnos:", students);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Error:", message.slice(0, 300));
} finally {
  await prisma.$disconnect();
  await pool.end();
}
