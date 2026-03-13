// prisma/assign-student-group.ts
// Asigna al alumno 122030001 al grupo ISC 3A directamente
// Ejecutar con: npx tsx prisma/assign-student-group.ts

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔧 Asignando alumno a grupo...\n");

  // 1. Buscar el alumno
  const alumno = await prisma.student.findUnique({
    where: { matricula: "122030001" },
    include: { career: true, groups: { include: { group: true } } },
  });

  if (!alumno) {
    console.error("❌ No se encontró el alumno 122030001");
    process.exit(1);
  }
  console.log(`✓ Alumno: ${alumno.name} ${alumno.lastName} | Carrera: ${alumno.career.code}`);

  if (alumno.groups.length > 0) {
    console.log(`ℹ️  Ya tiene grupo asignado: ${alumno.groups[0].group.name}`);
    console.log("   Continuando de todas formas con el seed principal...");
    return;
  }

  // 2. Buscar todos los grupos disponibles
  const grupos = await prisma.group.findMany({
    where: { isActive: true },
    include: { career: true },
    orderBy: { name: "asc" },
  });

  console.log("\n📋 Grupos disponibles:");
  grupos.forEach((g, i) => console.log(`   ${i + 1}. [${g.career.code}] ${g.name} — ${g.period}`));

  // 3. Buscar grupo de la misma carrera del alumno
  let grupo = grupos.find(g => g.careerId === alumno.careerId);

  if (!grupo) {
    // Si no hay de su carrera, usar el primero disponible
    grupo = grupos[0];
    console.log(`\n⚠️  No hay grupo de ${alumno.career.code}, usando: ${grupo.career.code} ${grupo.name}`);
  } else {
    console.log(`\n✓ Grupo encontrado para ${alumno.career.code}: ${grupo.name}`);
  }

  // 4. Crear el enrollment
  await prisma.groupEnrollment.upsert({
    where: {
      studentId_groupId: {
        studentId: alumno.id,
        groupId: grupo.id,
      },
    },
    update: {},
    create: {
      studentId: alumno.id,
      groupId: grupo.id,
    },
  });

  console.log(`\n✅ Alumno ${alumno.matricula} asignado a: [${grupo.career.code}] ${grupo.name} (${grupo.period})`);
  console.log("\n🚀 Ahora ejecuta: npx tsx prisma/seed-test.ts");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
