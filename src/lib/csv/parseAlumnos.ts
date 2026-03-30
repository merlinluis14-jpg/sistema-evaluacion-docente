import Papa from "papaparse";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { syncSubjectsForGroup } from "@/lib/groupAssignments";

type CsvRow = {
  matricula: string;
  nombre: string;
  apellido: string;
  email?: string;
  carrera_code: string;
  grupo: string;
  password?: string;
};

type ImportError = {
  row: number;
  matricula: string;
  reason: string;
};

type ImportResult = {
  total: number;
  success: number;
  errors: ImportError[];
};

export async function parseAndImportAlumnos(
  csvText: string,
  periodo: string,
): Promise<ImportResult> {
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
  const groupCache = new Map<string, string>();

  for (let index = 0; index < rows.length; index++) {
    const rowNumber = index + 2;
    const row = rows[index];
    const { matricula, nombre, apellido, carrera_code, grupo } = row;

    const missingFields: string[] = [];
    if (!matricula) missingFields.push("matricula");
    if (!nombre) missingFields.push("nombre");
    if (!apellido) missingFields.push("apellido");
    if (!carrera_code) missingFields.push("carrera_code");
    if (!grupo) missingFields.push("grupo");

    if (missingFields.length > 0) {
      errors.push({
        row: rowNumber,
        matricula: matricula || "(vacio)",
        reason: `Campos requeridos faltantes: ${missingFields.join(", ")}`,
      });
      continue;
    }

    try {
      let careerId = careerCache.get(carrera_code.toUpperCase());

      if (!careerId) {
        const career = await prisma.career.findFirst({
          where: {
            code: carrera_code.toUpperCase(),
            isActive: true,
          },
        });

        if (!career) {
          errors.push({
            row: rowNumber,
            matricula,
            reason: `Carrera "${carrera_code}" no existe o no esta activa`,
          });
          continue;
        }

        careerId = career.id;
        careerCache.set(carrera_code.toUpperCase(), careerId);
      }

      const normalizedGroup = grupo.toUpperCase();
      const groupKey = `${careerId}:${periodo}:${normalizedGroup}`;
      let groupId = groupCache.get(groupKey);

      if (!groupId) {
        const existingGroup = await prisma.group.findFirst({
          where: {
            careerId,
            name: { equals: normalizedGroup, mode: "insensitive" },
            period: periodo,
          },
        });

        if (existingGroup) {
          groupId = existingGroup.id;
        } else {
          const newGroup = await prisma.group.create({
            data: {
              name: normalizedGroup,
              period: periodo,
              careerId,
              isActive: true,
            },
          });
          groupId = newGroup.id;
        }

        groupCache.set(groupKey, groupId);
      }

      const rawPassword = row.password?.trim() || matricula;
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const user = await prisma.user.upsert({
        where: { username: matricula },
        update: { isActive: true },
        create: {
          username: matricula,
          password: hashedPassword,
          role: "ALUMNO",
          isActive: true,
        },
      });

      const student = await prisma.student.upsert({
        where: { matricula },
        update: {
          name: nombre,
          lastName: apellido,
          careerId,
          isActive: true,
        },
        create: {
          userId: user.id,
          matricula,
          name: nombre,
          lastName: apellido,
          careerId,
          isActive: true,
        },
      });

      await prisma.groupEnrollment.upsert({
        where: {
          studentId_groupId: {
            studentId: student.id,
            groupId,
          },
        },
        update: {},
        create: {
          studentId: student.id,
          groupId,
        },
      });

      // Mantiene el grupo listo para evaluar sin una asignacion manual extra de materias.
      await syncSubjectsForGroup(groupId, careerId, normalizedGroup);

      success++;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      errors.push({
        row: rowNumber,
        matricula: matricula || "(vacio)",
        reason: message.includes("Unique constraint")
          ? "Matricula duplicada en el CSV"
          : `Error inesperado: ${message}`,
      });
    }
  }

  return {
    total: rows.length,
    success,
    errors,
  };
}
