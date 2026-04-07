// prisma/check-data.ts - Diagnostico rapido del estado de la BD
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
  const careers = await prisma.career.findMany({ orderBy: { code: "asc" } });
  console.log("\nCARRERAS:");
  careers.forEach((career) =>
    console.log(
      `   ${career.id.slice(0, 8)} | ${career.code} - ${career.name} | activa: ${career.isActive}`,
    ),
  );

  const subjects = await prisma.subject.findMany({
    include: { career: true, teacher: true },
    take: 20,
  });
  console.log(`\nMATERIAS (${subjects.length} total):`);
  subjects.forEach((subject) =>
    console.log(
      `   [${subject.career.code}] ${subject.code} - ${subject.name} | activa: ${subject.isActive}`,
    ),
  );

  const alumno = await prisma.student.findUnique({
    where: { matricula: "122030001" },
    include: { career: true, groups: { include: { group: true } } },
  });

  console.log("\nALUMNO 122030001:");
  if (alumno) {
    console.log(`   Nombre: ${alumno.name} ${alumno.lastName}`);
    console.log(`   Carrera: ${alumno.career.code} (id: ${alumno.careerId.slice(0, 8)})`);
    console.log(`   Grupos: ${alumno.groups.map((g) => g.group.name).join(", ") || "NINGUNO"}`);
  } else {
    console.log("   NO ENCONTRADO");
  }
}

main()
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
