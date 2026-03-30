import Papa from "papaparse";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { TeacherPosition } from "@/lib/reportes";

type CsvRow = {
  nombre: string;
  apellido: string;
  email: string;
  numero_empleado: string;
  carrera_code: string;
  tipo_docente?: string;
  password?: string;
};

type ImportError = { row: number; identifier: string; reason: string };
type ImportResult = { total: number; success: number; errors: ImportError[] };

export async function parseAndImportDocentes(csvText: string): Promise<ImportResult> {
  const parsed = Papa.parse<CsvRow>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
    transform: (value) => value.trim(),
  });

  const rows = parsed.data;
  const errors: ImportError[] = [];
  let success = 0;

  const careerCache = new Map<string, string>();

  for (let index = 0; index < rows.length; index++) {
    const rowNum = index + 2;
    const row = rows[index];

    const { nombre, apellido, email, numero_empleado, carrera_code } = row;
    const position = (row.tipo_docente || "PA").toUpperCase() as TeacherPosition;
    const missing: string[] = [];
    if (!nombre) missing.push("nombre");
    if (!apellido) missing.push("apellido");
    if (!email) missing.push("email");
    if (!numero_empleado) missing.push("numero_empleado");
    if (!carrera_code) missing.push("carrera_code");

    if (missing.length > 0) {
      errors.push({
        row: rowNum,
        identifier: numero_empleado || "(vacio)",
        reason: `Campos faltantes: ${missing.join(", ")}`,
      });
      continue;
    }

    if (position !== "PA" && position !== "PTC") {
      errors.push({
        row: rowNum,
        identifier: numero_empleado || "(vacio)",
        reason: "tipo_docente debe ser PA o PTC",
      });
      continue;
    }

    try {
      let careerId = careerCache.get(carrera_code.toUpperCase());
      if (!careerId) {
        const career = await prisma.career.findFirst({
          where: { code: carrera_code.toUpperCase(), isActive: true },
        });
        if (!career) {
          errors.push({
            row: rowNum,
            identifier: numero_empleado,
            reason: `Carrera "${carrera_code}" no existe`,
          });
          continue;
        }
        careerId = career.id;
        careerCache.set(carrera_code.toUpperCase(), careerId);
      }

      const rawPassword = row.password?.trim() || numero_empleado;
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const user = await prisma.user.upsert({
        where: { email },
        update: { isActive: true },
        create: {
          email,
          password: hashedPassword,
          role: "DOCENTE",
          isActive: true,
        },
      });

      await prisma.teacher.upsert({
        where: { employeeId: numero_empleado },
        update: { name: nombre, lastName: apellido, careerId, position, isActive: true },
        create: {
          userId: user.id,
          name: nombre,
          lastName: apellido,
          employeeId: numero_empleado,
          careerId,
          position,
          isActive: true,
        },
      });

      success++;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      errors.push({
        row: rowNum,
        identifier: numero_empleado || "(vacio)",
        reason: message.includes("Unique constraint")
          ? "Email o numero de empleado duplicado"
          : `Error: ${message}`,
      });
    }
  }

  return { total: rows.length, success, errors };
}
