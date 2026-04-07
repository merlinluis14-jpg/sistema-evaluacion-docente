// prisma/seed-test.ts
// Asigna las materias existentes al grupo del alumno de prueba 122030001
// Ejecutar con: npx tsx prisma/seed-test.ts

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
  console.log("Configurando datos de prueba...\n");

  const alumno = await prisma.student.findUnique({
    where: { matricula: "122030001" },
    include: {
      groups: { include: { group: true } },
    },
  });

  if (!alumno) {
    console.error("No se encontro el alumno 122030001");
    console.log("Verifica que el seed principal ya se ejecuto.");
    process.exit(1);
  }

  console.log(`Alumno encontrado: ${alumno.name} ${alumno.lastName}`);

  const grupoEnrollment = alumno.groups[0];
  if (!grupoEnrollment) {
    console.error("El alumno no tiene grupo asignado");
    console.log("Asignalo a un grupo desde /admin/grupos primero.");
    process.exit(1);
  }

  const grupo = grupoEnrollment.group;
  console.log(`Grupo encontrado: ${grupo.name} (${grupo.period})`);

  const materias = await prisma.subject.findMany({
    where: {
      careerId: alumno.careerId,
      isActive: true,
    },
    include: { teacher: true },
  });

  if (materias.length === 0) {
    console.error("No hay materias registradas para la carrera del alumno");
    console.log("Crea materias desde /admin/materias primero.");
    process.exit(1);
  }

  console.log(`Materias encontradas: ${materias.length}`);
  console.log("\nAsignando materias al grupo...");

  let asignadas = 0;
  for (const materia of materias) {
    await prisma.groupSubject.upsert({
      where: {
        groupId_subjectId: {
          groupId: grupo.id,
          subjectId: materia.id,
        },
      },
      update: {},
      create: {
        groupId: grupo.id,
        subjectId: materia.id,
      },
    });
    console.log(`   ${materia.code} - ${materia.name} -> ${grupo.name}`);
    asignadas++;
  }

  console.log("\n===========================================");
  console.log("Configuracion completada");
  console.log("===========================================");
  console.log(`Alumno: ${alumno.matricula} - ${alumno.name} ${alumno.lastName}`);
  console.log(`Grupo: ${grupo.name} (${grupo.period})`);
  console.log(`Materias asignadas: ${asignadas}`);
  console.log("===========================================\n");
  console.log("Ahora prueba el flujo:");
  console.log("1. Login: matricula 122030001 / password123");
  console.log("2. Verifica que ves las materias en /alumno");
  console.log("3. Haz clic en 'Evaluar Docente'");
  console.log("4. Completa el formulario FDA-24.5\n");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
