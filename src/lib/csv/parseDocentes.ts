import Papa from "papaparse";
import bcrypt from "bcryptjs";

import { syncTeacherCatalogByCareer } from "@/lib/catalogSync";
import { prisma } from "@/lib/prisma";
import type { TeacherPosition } from "@/lib/reportes";
import {
  buildImportProgress,
  type ImportProgressOptions,
} from "@/lib/import/progress";

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

export type TeacherImportResult = {
  total: number;
  success: number;
  errors: ImportError[];
  deactivatedCount?: number;
};

type TeacherImportOptions = ImportProgressOptions & {
  syncCatalog?: boolean;
};

export async function parseAndImportDocentes(
  csvText: string,
  options?: TeacherImportOptions,
): Promise<TeacherImportResult> {
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
  const importedEmployeeIds = new Set<string>();
  const affectedCareerIds = new Set<string>();
  const reportProgress = (processed: number) =>
    options?.onProgress?.(
      buildImportProgress(processed, rows.length, success, errors.length),
    );

  await reportProgress(0);

  for (let index = 0; index < rows.length; index++) {
    const rowNum = index + 2;
    const row = rows[index];

    try {
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

      const existingTeacher = await prisma.teacher.findUnique({
        where: { employeeId: numero_empleado },
        include: { user: true },
      });

      const normalizedEmail = email.toLowerCase();
      const providedPassword = row.password?.trim();

      if (providedPassword && providedPassword.length < 8) {
        errors.push({
          row: rowNum,
          identifier: numero_empleado,
          reason: "La password debe tener al menos 8 caracteres",
        });
        continue;
      }

      if (existingTeacher) {
        const conflictingUser = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            id: { not: existingTeacher.userId },
          },
          select: { id: true },
        });

        if (conflictingUser) {
          errors.push({
            row: rowNum,
            identifier: numero_empleado,
            reason: `El email "${normalizedEmail}" ya esta asignado a otra cuenta`,
          });
          continue;
        }

        const userData: {
          email: string;
          isActive: boolean;
          password?: string;
        } = {
          email: normalizedEmail,
          isActive: true,
        };

        if (providedPassword) {
          userData.password = await bcrypt.hash(providedPassword, 10);
        }

        await prisma.user.update({
          where: { id: existingTeacher.userId },
          data: userData,
        });

        await prisma.teacher.update({
          where: { id: existingTeacher.id },
          data: {
            name: nombre,
            lastName: apellido,
            careerId,
            position,
            isActive: true,
          },
        });
      } else {
        if (!providedPassword) {
          errors.push({
            row: rowNum,
            identifier: numero_empleado,
            reason: "La columna password es obligatoria para crear nuevos docentes por seguridad",
          });
          continue;
        }

        const passwordToStore = providedPassword;
        const hashedPassword = await bcrypt.hash(passwordToStore, 10);

        const existingUser = await prisma.user.findFirst({
          where: { email: normalizedEmail },
        });

        let userId: string;

        if (existingUser) {
          const teacherWithSameUser = await prisma.teacher.findFirst({
            where: { userId: existingUser.id },
            select: { id: true },
          });

          if (teacherWithSameUser) {
            errors.push({
              row: rowNum,
              identifier: numero_empleado,
              reason: `El email "${normalizedEmail}" ya pertenece a otro docente`,
            });
            continue;
          }

          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              email: normalizedEmail,
              password: hashedPassword,
              role: "DOCENTE",
              isActive: true,
            },
          });

          userId = existingUser.id;
        } else {
          const user = await prisma.user.create({
            data: {
              email: normalizedEmail,
              password: hashedPassword,
              role: "DOCENTE",
              isActive: true,
            },
          });

          userId = user.id;
        }

        await prisma.teacher.create({
          data: {
            userId,
            name: nombre,
            lastName: apellido,
            employeeId: numero_empleado,
            careerId,
            position,
            isActive: true,
          },
        });
      }

      importedEmployeeIds.add(numero_empleado);
      affectedCareerIds.add(careerId);
      success++;
    } catch (error: unknown) {
      const { numero_empleado } = row;
      const message = error instanceof Error ? error.message : "Error desconocido";
      errors.push({
        row: rowNum,
        identifier: numero_empleado || "(vacio)",
        reason: message.includes("Unique constraint")
          ? "Email o numero de empleado duplicado"
          : `Error: ${message}`,
      });
    } finally {
      await reportProgress(index + 1);
    }
  }

  let deactivatedCount = 0;
  if (options?.syncCatalog && errors.length === 0) {
    deactivatedCount = await syncTeacherCatalogByCareer({
      careerIds: [...affectedCareerIds],
      importedEmployeeIds: [...importedEmployeeIds],
    });
  }

  return {
    total: rows.length,
    success,
    errors,
    deactivatedCount,
  };
}
