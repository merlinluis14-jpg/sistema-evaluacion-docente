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
  console.log("🌱 Creando docentes y materias de prueba para ISC...\n");

  // ── 1. Obtener carrera ISC ────────────────────────────────
  const isc = await prisma.career.findUnique({ where: { code: "ISC" } });
  if (!isc) {
    console.error("❌ No se encontró la carrera ISC. Ejecuta el seed principal primero.");
    process.exit(1);
  }
  console.log(`✓ Carrera ISC encontrada: ${isc.id.slice(0, 8)}`);

  // ── 2. Crear 3 docentes de prueba ─────────────────────────
  const docentesData = [
    { name: "Carlos",   lastName: "Ramírez",  email: "carlos.ramirez@uptx.edu.mx",  employeeId: "EMP-001" },
    { name: "María",    lastName: "González", email: "maria.gonzalez@uptx.edu.mx",  employeeId: "EMP-002" },
    { name: "Roberto",  lastName: "Sánchez",  email: "roberto.sanchez@uptx.edu.mx", employeeId: "EMP-003" },
  ];

  const password = await bcrypt.hash("Docente@2026", 10);
  const docentes: { id: string; name: string }[] = [];

  console.log("\n👨‍🏫 Creando docentes...");
  for (const d of docentesData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        password,
        role: "DOCENTE",
        isActive: true,
      },
    });

    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId:     user.id,
        name:       d.name,
        lastName:   d.lastName,
        employeeId: d.employeeId,
        careerId:   isc.id,
      },
    });

    docentes.push({ id: teacher.id, name: `${d.name} ${d.lastName}` });
    console.log(`   ✓ ${d.name} ${d.lastName} (${d.email})`);
  }

  // ── 3. Crear materias de ISC ──────────────────────────────
  const materiasData = [
    { code: "ISC-BD1",   name: "Base de Datos I",                cuatrimestre: 3, teacherIdx: 0 },
    { code: "ISC-POO",   name: "Programación Orientada a Objetos", cuatrimestre: 3, teacherIdx: 1 },
    { code: "ISC-MAT",   name: "Matemáticas Discretas",           cuatrimestre: 3, teacherIdx: 2 },
    { code: "ISC-REDES", name: "Redes y Telecomunicaciones",      cuatrimestre: 3, teacherIdx: 0 },
    { code: "ISC-ING",   name: "Ingeniería de Software",          cuatrimestre: 3, teacherIdx: 1 },
  ];

  console.log("\n📚 Creando materias...");
  const materias: { id: string; code: string; name: string }[] = [];
  for (const m of materiasData) {
    const subject = await prisma.subject.upsert({
      where: { code_careerId: { code: m.code, careerId: isc.id } },
      update: { teacherId: docentes[m.teacherIdx].id },
      create: {
        code:         m.code,
        name:         m.name,
        cuatrimestre: m.cuatrimestre,
        careerId:     isc.id,
        teacherId:    docentes[m.teacherIdx].id,
        isActive:     true,
      },
    });
    materias.push({ id: subject.id, code: m.code, name: m.name });
    console.log(`   ✓ ${m.code} — ${m.name} → ${docentes[m.teacherIdx].name}`);
  }

  // ── 4. Asignar materias al grupo del alumno 122030001 ─────
  const alumno = await prisma.student.findUnique({
    where: { matricula: "122030001" },
    include: { groups: { include: { group: true } } },
  });

  if (!alumno || alumno.groups.length === 0) {
    console.log("\n⚠️  El alumno no tiene grupo asignado todavía.");
    console.log("   Ejecuta primero: npx tsx prisma/assign-student-group.ts");
    console.log("   Las materias ya están creadas. Luego corre seed-test.ts");
    return;
  }

  const grupo = alumno.groups[0].group;
  console.log(`\n🔗 Asignando materias al grupo ${grupo.name}...`);

  for (const materia of materias) {
    await prisma.groupSubject.upsert({
      where: { groupId_subjectId: { groupId: grupo.id, subjectId: materia.id } },
      update: {},
      create: { groupId: grupo.id, subjectId: materia.id },
    });
    console.log(`   ✓ ${materia.code} → ${grupo.name}`);
  }

  // ── 5. Resumen ────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════");
  console.log("✅ Configuración completa");
  console.log("═══════════════════════════════════════════");
  console.log(`   Docentes creados: ${docentes.length}`);
  console.log(`   Materias creadas: ${materias.length}`);
  console.log(`   Asignadas a:      ${grupo.name} (${grupo.period})`);
  console.log("═══════════════════════════════════════════\n");
  console.log("🚀 Prueba el flujo completo:");
  console.log("   Login alumno:   122030001  / password123");
  console.log("   Login docente:  carlos.ramirez@uptx.edu.mx / Docente@2026");
  console.log("   Login admin:    admin@uptx.edu.mx / Admin@UPTX2026\n");
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
