// prisma/seed-materias.ts
// Crea docentes y materias de prueba para ISC y las asigna al grupo del alumno 122030001
// Ejecutar con: npx tsx prisma/seed-materias.ts

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Creando docentes y materias de prueba para ISC...\n");

  const isc = await prisma.career.findUnique({ where: { code: "ISC" } });
  if (!isc) {
    console.error("No se encontro la carrera ISC. Ejecuta el seed principal primero.");
    process.exit(1);
  }
  console.log(`Carrera ISC encontrada: ${isc.id.slice(0, 8)}`);

  const docentesData = [
    { name: "Carlos", lastName: "Ramirez", email: "carlos.ramirez@uptx.edu.mx", employeeId: "EMP-001" },
    { name: "Maria", lastName: "Gonzalez", email: "maria.gonzalez@uptx.edu.mx", employeeId: "EMP-002" },
    { name: "Roberto", lastName: "Sanchez", email: "roberto.sanchez@uptx.edu.mx", employeeId: "EMP-003" },
  ];

  const password = await bcrypt.hash("Docente@2026", 10);
  const docentes: { id: string; name: string }[] = [];

  console.log("\nCreando docentes...");
  for (const docente of docentesData) {
    const user = await prisma.user.upsert({
      where: { email: docente.email },
      update: {},
      create: {
        email: docente.email,
        password,
        role: "DOCENTE",
        isActive: true,
      },
    });

    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: docente.name,
        lastName: docente.lastName,
        employeeId: docente.employeeId,
        careerId: isc.id,
        position: "PA",
      },
    });

    docentes.push({ id: teacher.id, name: `${docente.name} ${docente.lastName}` });
    console.log(`   ${docente.name} ${docente.lastName} (${docente.email})`);
  }

  const materiasData = [
    { code: "ISC-BD1", name: "Base de Datos I", cuatrimestre: 3, teacherIdx: 0 },
    { code: "ISC-POO", name: "Programación Orientada a Objetos", cuatrimestre: 3, teacherIdx: 1 },
    { code: "ISC-MAT", name: "Matemáticas Discretas", cuatrimestre: 3, teacherIdx: 2 },
    { code: "ISC-REDES", name: "Redes y Telecomunicaciones", cuatrimestre: 3, teacherIdx: 0 },
    { code: "ISC-ING", name: "Ingeniería de Software", cuatrimestre: 3, teacherIdx: 1 },
  ];

  console.log("\nCreando materias...");
  const materias: { id: string; code: string; name: string }[] = [];
  for (const materia of materiasData) {
    const subject = await prisma.subject.upsert({
      where: { code_careerId: { code: materia.code, careerId: isc.id } },
      update: { teacherId: docentes[materia.teacherIdx].id },
      create: {
        code: materia.code,
        name: materia.name,
        cuatrimestre: materia.cuatrimestre,
        careerId: isc.id,
        teacherId: docentes[materia.teacherIdx].id,
        isActive: true,
      },
    });
    materias.push({ id: subject.id, code: materia.code, name: materia.name });
    console.log(`   ${materia.code} - ${materia.name} -> ${docentes[materia.teacherIdx].name}`);
  }

  const alumno = await prisma.student.findUnique({
    where: { matricula: "122030001" },
    include: { groups: { include: { group: true } } },
  });

  if (!alumno || alumno.groups.length === 0) {
    console.log("\nEl alumno no tiene grupo asignado todavia.");
    console.log("Ejecuta primero: npx tsx prisma/assign-student-group.ts");
    console.log("Las materias ya estan creadas. Luego corre seed-test.ts");
    return;
  }

  const grupo = alumno.groups[0].group;
  console.log(`\nAsignando materias al grupo ${grupo.name}...`);

  for (const materia of materias) {
    await prisma.groupSubject.upsert({
      where: { groupId_subjectId: { groupId: grupo.id, subjectId: materia.id } },
      update: {},
      create: { groupId: grupo.id, subjectId: materia.id },
    });
    console.log(`   ${materia.code} -> ${grupo.name}`);
  }

  console.log("\n===========================================");
  console.log("Configuracion completa");
  console.log("===========================================");
  console.log(`Docentes creados: ${docentes.length}`);
  console.log(`Materias creadas: ${materias.length}`);
  console.log(`Asignadas a: ${grupo.name} (${grupo.period})`);
  console.log("===========================================\n");
  console.log("Prueba el flujo completo:");
  console.log("Login alumno: 122030001 / password123");
  console.log("Login docente: carlos.ramirez@uptx.edu.mx / Docente@2026");
  console.log("Login admin: admin@uptx.edu.mx / Admin@UPTX2026\n");
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
