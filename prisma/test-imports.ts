/**
 * Script de validación para los parsers de importación CSV.
 * Ejecuta los tres parsers directamente contra la base de datos.
 *
 * Uso: npx tsx prisma/test-imports.ts
 */
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function readCsv(filename: string): string {
  return fs.readFileSync(path.join(__dirname, "../test-csv", filename), "utf-8");
}

function printResult(
  label: string,
  result: { total: number; success: number; errors: { row: number; reason: string }[] }
) {
  console.log(`\n--- ${label} ---`);
  console.log(`  Total filas : ${result.total}`);
  console.log(`  Importados  : ${result.success}`);
  console.log(`  Errores     : ${result.errors.length}`);
  for (const e of result.errors) {
    console.log(`    Fila ${e.row}: ${e.reason}`);
  }
}

async function main() {
  console.log("Iniciando validacion de importaciones CSV\n");

  // Docentes
  const { parseAndImportDocentes } = await import("../src/lib/csv/parseDocentes");
  printResult("DOCENTES", await parseAndImportDocentes(readCsv("docentes_test.csv")));

  // Alumnos — requiere periodo activo
  const periodo = await prisma.period.findFirst({ where: { isActive: true }, select: { name: true } });
  if (!periodo) {
    console.warn("  Sin periodo activo — omitiendo importacion de alumnos.");
  } else {
    const { parseAndImportAlumnos } = await import("../src/lib/csv/parseAlumnos");
    printResult("ALUMNOS", await parseAndImportAlumnos(readCsv("alumnos_test.csv"), periodo.name));
  }

  // Materias — requiere docentes existentes
  const { parseAndImportMaterias } = await import("../src/lib/csv/parseMaterias");
  printResult("MATERIAS", await parseAndImportMaterias(readCsv("materias_test.csv")));

  // Totales finales
  const [docentes, alumnos, materias] = await Promise.all([
    prisma.teacher.count({ where: { isActive: true } }),
    prisma.student.count({ where: { isActive: true } }),
    prisma.subject.count({ where: { isActive: true } }),
  ]);
  console.log(`\nTotales en BD: Docentes=${docentes}  Alumnos=${alumnos}  Materias=${materias}`);
}

main()
  .catch((e) => { console.error("Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
