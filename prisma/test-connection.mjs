import { config } from "dotenv";
config();
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ CARGADA" : "❌ NO ENCONTRADA");
console.log("URL value starts with:", process.env.DATABASE_URL?.slice(0, 30));

import { PrismaClient } from "@prisma/client";
const p = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
try {
  const c = await p.student.count();
  console.log("✅ Conexión OK - Alumnos:", c);
} catch (e) {
  console.error("❌ Error:", e.message?.slice(0, 300));
} finally {
  await p.$disconnect();
}
