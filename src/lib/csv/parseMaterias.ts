import Papa from "papaparse";

import { syncSubjectCatalogByCareer } from "@/lib/catalogSync";
import { getCareerByCodeForImport } from "@/lib/careers";
import { resyncGroupsForSubject } from "@/lib/groupAssignments";
import {
  buildImportProgress,
  type ImportProgressOptions,
} from "@/lib/import/progress";
import { prisma } from "@/lib/prisma";
import { formatAcademicText } from "@/lib/text/academicText";

type CsvRow = {
  nombre: string;
  codigo: string;
  cuatrimestre: string;
  carrera_code: string;
  numero_empleado: string;
};

type ImportError = { row: number; identifier: string; reason: string };

export type SubjectImportResult = {
  total: number;
  success: number;
  errors: ImportError[];
  deactivatedCount?: number;
};

type SubjectImportOptions = ImportProgressOptions & {
  syncCatalog?: boolean;
};

export async function parseAndImportMaterias(
  csvText: string,
  options?: SubjectImportOptions,
): Promise<SubjectImportResult> {
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
  const teacherCache = new Map<string, string>();
  const importedSubjectKeys = new Set<string>();
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
      const { nombre, codigo, cuatrimestre, carrera_code, numero_empleado } = row;
      const normalizedName = formatAcademicText(nombre);
      const missingFields: string[] = [];
      if (!normalizedName) missingFields.push("nombre");
      if (!codigo) missingFields.push("codigo");
      if (!cuatrimestre) missingFields.push("cuatrimestre");
      if (!carrera_code) missingFields.push("carrera_code");
      if (!numero_empleado) missingFields.push("numero_empleado");

      if (missingFields.length > 0) {
        errors.push({
          row: rowNumber,
        identifier: codigo || "(vacío)",
          reason: `Campos faltantes: ${missingFields.join(", ")}`,
        });
        continue;
      }

      const cuatrimestreValue = parseInt(cuatrimestre, 10);
      if (
        Number.isNaN(cuatrimestreValue) ||
        cuatrimestreValue < 1 ||
        cuatrimestreValue > 12
      ) {
        errors.push({
          row: rowNumber,
          identifier: codigo,
          reason: `Cuatrimestre invalido: "${cuatrimestre}"`,
        });
        continue;
      }

      let careerId = careerCache.get(carrera_code.toUpperCase());
      if (!careerId) {
        const career = await getCareerByCodeForImport(carrera_code);

        if (!career) {
          errors.push({
            row: rowNumber,
            identifier: codigo,
            reason: `Carrera "${carrera_code}" no existe en el catalogo`,
          });
          continue;
        }

        careerId = career.id;
        careerCache.set(carrera_code.toUpperCase(), careerId);
      }

      let teacherId = teacherCache.get(numero_empleado);
      if (!teacherId) {
        const teacher = await prisma.teacher.findUnique({
          where: { employeeId: numero_empleado },
        });

        if (!teacher) {
          errors.push({
            row: rowNumber,
            identifier: codigo,
            reason: `Docente con número "${numero_empleado}" no existe`,
          });
          continue;
        }

        teacherId = teacher.id;
        teacherCache.set(numero_empleado, teacherId);
      }

      const subject = await prisma.subject.upsert({
        where: {
          code_careerId: {
            code: codigo.toUpperCase(),
            careerId,
          },
        },
        update: {
          name: normalizedName,
          code: codigo.toUpperCase(),
          cuatrimestre: cuatrimestreValue,
          teacherId,
          isActive: true,
        },
        create: {
          name: normalizedName,
          code: codigo.toUpperCase(),
          cuatrimestre: cuatrimestreValue,
          teacherId,
          careerId,
          isActive: true,
        },
      });

      await resyncGroupsForSubject(subject.id, careerId, cuatrimestreValue);

      importedSubjectKeys.add(`${careerId}:${subject.code}`);
      affectedCareerIds.add(careerId);
      success++;
    } catch (error: unknown) {
      const { codigo } = row;
      const message = error instanceof Error ? error.message : "Error desconocido";
      errors.push({
        row: rowNumber,
        identifier: codigo || "(vacío)",
        reason: message.includes("Unique constraint")
          ? "Código de materia duplicado en la misma carrera"
          : `Error: ${message}`,
      });
    } finally {
      await reportProgress(index + 1);
    }
  }

  let deactivatedCount = 0;
  if (options?.syncCatalog && errors.length === 0) {
    deactivatedCount = await syncSubjectCatalogByCareer({
      careerIds: [...affectedCareerIds],
      importedSubjectKeys: [...importedSubjectKeys],
    });
  }

  return {
    total: rows.length,
    success,
    errors,
    deactivatedCount,
  };
}
