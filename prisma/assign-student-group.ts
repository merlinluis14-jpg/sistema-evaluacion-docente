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
  console.log("Asignando alumno a grupo...\n");

  const alumno = await prisma.student.findUnique({
    where: { matricula: "122030001" },
    include: { career: true, groups: { include: { group: true } } },
  });

  if (!alumno) {
    console.error("No se encontro el alumno 122030001");
    process.exit(1);
  }
  console.log(`Alumno: ${alumno.name} ${alumno.lastName} | Carrera: ${alumno.career.code}`);

  if (alumno.groups.length > 0) {
    console.log(`Ya tiene grupo asignado: ${alumno.groups[0].group.name}`);
    console.log("Continuando de todas formas con el seed principal...");
    return;
  }

  const grupos = await prisma.group.findMany({
    where: { isActive: true },
    include: { career: true },
    orderBy: { name: "asc" },
  });

  console.log("\nGrupos disponibles:");
  grupos.forEach((group, index) =>
    console.log(`   ${index + 1}. [${group.career.code}] ${group.name} - ${group.period}`),
  );

  let grupo = grupos.find((group) => group.careerId === alumno.careerId);

  if (!grupo) {
    grupo = grupos[0];
    console.log(`\nNo hay grupo de ${alumno.career.code}, usando: ${grupo.career.code} ${grupo.name}`);
  } else {
    console.log(`\nGrupo encontrado para ${alumno.career.code}: ${grupo.name}`);
  }

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

  console.log(`\nAlumno ${alumno.matricula} asignado a: [${grupo.career.code}] ${grupo.name} (${grupo.period})`);
  console.log("\nAhora ejecuta: npx tsx prisma/seed-test.ts");
}

main()
  .catch((error) => {
    console.error("Error:", error.message ?? error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
