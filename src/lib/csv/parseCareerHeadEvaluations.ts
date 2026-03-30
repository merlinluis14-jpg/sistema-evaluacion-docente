import Papa from "papaparse";
import type { TeacherPosition } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CsvRow = {
  nombre_docente: string;
  puesto: string;
  carrera_code: string;
  evaluador?: string;
  elaborado_por?: string;
  periodo_origen?: string;
  plan_course_score?: string;
  competency_eval_score?: string;
  research_score?: string;
  tutoring_score?: string;
  advisory_score?: string;
  platform_usage_score?: string;
  problem_solving_score?: string;
  punctuality_score?: string;
  teamwork_score?: string;
  resp_pe_avg?: string;
  student_avg?: string;
  source_final_avg?: string;
  source_sheet?: string;
  comments?: string;
};

type ImportError = { row: number; identifier: string; reason: string };
type ImportResult = { total: number; success: number; errors: ImportError[] };

// El Excel institucional no incluye un identificador unico por docente, asi que el cruce se hace por nombre normalizado.
function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseOptionalScore(value?: string) {
  const normalized = value?.trim();
  if (!normalized || normalized.toUpperCase() === "N/A") {
    return null;
  }

  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

// Conserva en la base el origen del registro importado para facilitar auditoria manual.
function buildAuditComment(row: CsvRow) {
  const segments = [
    row.periodo_origen ? `Periodo origen: ${row.periodo_origen}` : null,
    row.resp_pe_avg ? `Resp.PE: ${row.resp_pe_avg}` : null,
    row.student_avg ? `Estudiante: ${row.student_avg}` : null,
    row.source_final_avg ? `Final fuente: ${row.source_final_avg}` : null,
    row.source_sheet ? `Hoja fuente: ${row.source_sheet}` : null,
    row.comments?.trim() ? row.comments.trim() : null,
  ].filter(Boolean);

  return segments.length > 0 ? segments.join(" | ") : null;
}

export async function parseAndImportCareerHeadEvaluations(
  csvText: string,
  periodId: string,
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

  const period = await prisma.period.findUnique({
    where: { id: periodId },
    select: { id: true },
  });

  if (!period) {
    throw new Error("El periodo seleccionado no existe");
  }

  const careers = await prisma.career.findMany({
    where: { isActive: true },
    select: { id: true, code: true },
  });
  const careerMap = new Map(careers.map((career) => [career.code.toUpperCase(), career.id]));

  const teachers = await prisma.teacher.findMany({
    where: { isActive: true },
    include: { career: true },
  });

  const teacherMap = new Map<string, (typeof teachers)[number]>();
  for (const teacher of teachers) {
    const forward = normalizeName(`${teacher.name} ${teacher.lastName}`);
    const backward = normalizeName(`${teacher.lastName} ${teacher.name}`);
    teacherMap.set(`${teacher.career.code}:${forward}`, teacher);
    teacherMap.set(`${teacher.career.code}:${backward}`, teacher);
  }

  for (let index = 0; index < rows.length; index++) {
    const rowNumber = index + 2;
    const row = rows[index];

    const requiredFields = ["nombre_docente", "puesto", "carrera_code"] as const;
    const missingFields = requiredFields.filter((field) => !row[field]);
    if (missingFields.length > 0) {
      errors.push({
        row: rowNumber,
        identifier: row.nombre_docente || "(vacio)",
        reason: `Campos faltantes: ${missingFields.join(", ")}`,
      });
      continue;
    }

    const careerCode = row.carrera_code.toUpperCase();
    const position = row.puesto.toUpperCase() as TeacherPosition;
    if (position !== "PA" && position !== "PTC") {
      errors.push({
        row: rowNumber,
        identifier: row.nombre_docente,
        reason: "puesto debe ser PA o PTC",
      });
      continue;
    }

    if (!careerMap.get(careerCode)) {
      errors.push({
        row: rowNumber,
        identifier: row.nombre_docente,
        reason: `Carrera "${careerCode}" no existe`,
      });
      continue;
    }

    const teacher = teacherMap.get(`${careerCode}:${normalizeName(row.nombre_docente)}`);
    if (!teacher) {
      errors.push({
        row: rowNumber,
        identifier: row.nombre_docente,
        reason: "No se encontro un docente activo que coincida con el nombre en esa carrera",
      });
      continue;
    }

    if (teacher.position !== position) {
      errors.push({
        row: rowNumber,
        identifier: row.nombre_docente,
        reason: `El puesto del sistema (${teacher.position}) no coincide con el archivo (${position})`,
      });
      continue;
    }

    try {
      await prisma.careerHeadEvaluation.upsert({
        where: {
          teacherId_periodId: {
            teacherId: teacher.id,
            periodId,
          },
        },
        update: {
          evaluatorName: row.elaborado_por || row.evaluador || null,
          comments: buildAuditComment(row),
          planCourseScore: parseOptionalScore(row.plan_course_score),
          competencyEvalScore: parseOptionalScore(row.competency_eval_score),
          researchScore: parseOptionalScore(row.research_score),
          tutoringScore: parseOptionalScore(row.tutoring_score),
          advisoryScore: parseOptionalScore(row.advisory_score),
          platformUsageScore: parseOptionalScore(row.platform_usage_score),
          problemSolvingScore: parseOptionalScore(row.problem_solving_score),
          punctualityScore: parseOptionalScore(row.punctuality_score),
          teamworkScore: parseOptionalScore(row.teamwork_score),
        },
        create: {
          teacherId: teacher.id,
          periodId,
          evaluatorName: row.elaborado_por || row.evaluador || null,
          comments: buildAuditComment(row),
          planCourseScore: parseOptionalScore(row.plan_course_score),
          competencyEvalScore: parseOptionalScore(row.competency_eval_score),
          researchScore: parseOptionalScore(row.research_score),
          tutoringScore: parseOptionalScore(row.tutoring_score),
          advisoryScore: parseOptionalScore(row.advisory_score),
          platformUsageScore: parseOptionalScore(row.platform_usage_score),
          problemSolvingScore: parseOptionalScore(row.problem_solving_score),
          punctualityScore: parseOptionalScore(row.punctuality_score),
          teamworkScore: parseOptionalScore(row.teamwork_score),
        },
      });

      success++;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      errors.push({
        row: rowNumber,
        identifier: row.nombre_docente,
        reason: `Error: ${message}`,
      });
    }
  }

  return { total: rows.length, success, errors };
}
