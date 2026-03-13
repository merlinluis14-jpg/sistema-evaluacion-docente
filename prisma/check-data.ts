// prisma/check-data.ts — Diagnóstico rápido del estado de la BD
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Carreras
  const careers = await prisma.career.findMany({ orderBy: { code: "asc" } });
  console.log("\n🎓 CARRERAS:");
  careers.forEach(c => console.log(`   ${c.id.slice(0,8)} | ${c.code} — ${c.name} | activa: ${c.isActive}`));

  // Materias
  const subjects = await prisma.subject.findMany({ include: { career: true, teacher: true }, take: 20 });
  console.log(`\n📚 MATERIAS (${subjects.length} total):`);
  subjects.forEach(s => console.log(`   [${s.career.code}] ${s.code} — ${s.name} | activa: ${s.isActive}`));

  // Alumno de prueba
  const alumno = await prisma.student.findUnique({
    where: { matricula: "122030001" },
    include: { career: true, groups: { include: { group: true } } }
  });
  console.log(`\n👤 ALUMNO 122030001:`);
  if (alumno) {
    console.log(`   Nombre: ${alumno.name} ${alumno.lastName}`);
    console.log(`   Carrera: ${alumno.career.code} (id: ${alumno.careerId.slice(0,8)})`);
    console.log(`   Grupos: ${alumno.groups.map(g => g.group.name).join(", ") || "NINGUNO"}`);
  } else {
    console.log("   ❌ NO ENCONTRADO");
  }
}

main()
  .catch(e => { console.error("Error:", e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
