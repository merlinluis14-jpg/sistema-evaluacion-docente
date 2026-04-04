import Papa from "papaparse";
import bcrypt from "bcryptjs";

import {
  replaceStudentEnrollmentForGroup,
  syncStudentRosterByPeriod,
} from "@/lib/catalogSync";
import { syncSubjectsForGroup } from "@/lib/groupAssignments";
import {
  buildImportProgress,
  type ImportProgressOptions,
} from "@/lib/import/progress";
import { prisma } from "@/lib/prisma";

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

export type StudentImportResult = {
  total: number;
  success: number;
  errors: ImportError[];
  removedEnrollments?: number;
};

type StudentImportOptions = ImportProgressOptions & {
  syncCatalog?: boolean;
};

export async function parseAndImportAlumnos(
  csvText: string,
  periodo: string,
  options?: StudentImportOptions,
): Promise<StudentImportResult> {
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
  const expectedGroupByStudentId = new Map<string, string>();
  const affectedCareerIds = new Set<string>();
  const reportProgress = (processed: number) =>
    options?.onProgress?.(
      buildImportProgress(processed, rows.length, success, errors.length),
    );

  await reportProgress(0);

  for (let index = 0; index < rows.length; index++) {
    const rowNumber = index + 2;
    const row = rows[index];

    try {
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

      const providedPassword = row.password?.trim();
      const normalizedEmail = row.email?.trim().toLowerCase() || null;
      const passwordToStore = providedPassword || matricula;
      const hashedPassword = await bcrypt.hash(passwordToStore, 10);

      const existingStudent = await prisma.student.findUnique({
        where: { matricula },
        include: { user: true },
      });

      let studentId: string;

      if (existingStudent) {
        await prisma.user.update({
          where: { id: existingStudent.userId },
          data: {
            username: matricula,
            email: normalizedEmail,
            isActive: true,
            ...(providedPassword
              ? {
                  password: hashedPassword,
                  canChangeInitialPassword: true,
                }
              : {}),
          },
        });

        const student = await prisma.student.update({
          where: { id: existingStudent.id },
          data: {
            name: nombre,
            lastName: apellido,
            careerId,
            isActive: true,
          },
        });

        studentId = student.id;
      } else {
        const user = await prisma.user.create({
          data: {
            username: matricula,
            email: normalizedEmail,
            password: hashedPassword,
            role: "ALUMNO",
            isActive: true,
            canChangeInitialPassword: true,
          },
        });

        const student = await prisma.student.create({
          data: {
            userId: user.id,
            matricula,
            name: nombre,
            lastName: apellido,
            careerId,
            isActive: true,
          },
        });

        studentId = student.id;
      }

      await replaceStudentEnrollmentForGroup(studentId, groupId);

      await syncSubjectsForGroup(groupId, careerId, normalizedGroup);

      expectedGroupByStudentId.set(studentId, groupId);
      affectedCareerIds.add(careerId);
      success++;
    } catch (error: unknown) {
      const { matricula } = row;
      const message = error instanceof Error ? error.message : "Error desconocido";
      errors.push({
        row: rowNumber,
        matricula: matricula || "(vacio)",
        reason: message.includes("Unique constraint")
          ? "Matricula, usuario o email duplicado en el sistema"
          : `Error inesperado: ${message}`,
      });
    } finally {
      await reportProgress(index + 1);
    }
  }

  let removedEnrollments = 0;
  if (options?.syncCatalog && errors.length === 0) {
    removedEnrollments = await syncStudentRosterByPeriod({
      careerIds: [...affectedCareerIds],
      period: periodo,
      expectedGroupByStudentId,
    });
  }

  return {
    total: rows.length,
    success,
    errors,
    removedEnrollments,
  };
}
