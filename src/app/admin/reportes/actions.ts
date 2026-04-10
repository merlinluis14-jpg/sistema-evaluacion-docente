"use server";

import { revalidatePath } from "next/cache";

import { assertCareerAccess, requireAdminScope } from "@/lib/adminScope";
import { prisma } from "@/lib/prisma";
import { getApplicableCareerHeadFactors, type CareerHeadFactorKey, type TeacherPosition } from "@/lib/reportes";

function toNullableScore(value: FormDataEntryValue | null) {
  if (value === null) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 5) {
    throw new Error("Todas las calificaciones de coordinación deben estar entre 0 y 5.");
  }

  return parsed;
}

export async function saveCareerHeadEvaluation(formData: FormData) {
  const scope = await requireAdminScope();

  const teacherId = String(formData.get("teacherId") || "").trim();
  const careerId = String(formData.get("careerId") || "").trim();
  const periodId = String(formData.get("periodId") || "").trim();
  const position = String(formData.get("position") || "").trim() as TeacherPosition;

  if (!teacherId || !careerId || !periodId || !position) {
    throw new Error("Faltan datos para guardar la evaluación de coordinación.");
  }

  assertCareerAccess(scope, careerId);

  const applicableFactorKeys = new Set(
    getApplicableCareerHeadFactors(position).map((factor) => factor.key),
  );

  const scoreEntries = Object.fromEntries(
    (
      [
        "planCourseScore",
        "competencyEvalScore",
        "researchScore",
        "tutoringScore",
        "advisoryScore",
        "platformUsageScore",
        "problemSolvingScore",
        "punctualityScore",
        "teamworkScore",
      ] as CareerHeadFactorKey[]
    ).map((key) => [key, applicableFactorKeys.has(key) ? toNullableScore(formData.get(key)) : null]),
  );

  await prisma.careerHeadEvaluation.upsert({
    where: {
      teacherId_careerId_periodId: { teacherId, careerId, periodId },
    },
    update: {
      evaluatorName: String(formData.get("evaluatorName") || "").trim() || null,
      comments: String(formData.get("comments") || "").trim() || null,
      ...scoreEntries,
    },
    create: {
      teacherId,
      careerId,
      periodId,
      evaluatorName: String(formData.get("evaluatorName") || "").trim() || null,
      comments: String(formData.get("comments") || "").trim() || null,
      ...scoreEntries,
    },
  });

  revalidatePath("/admin/reportes");
  revalidatePath(`/admin/reportes/${teacherId}`);
}
