import { NextResponse } from "next/server";

import { getRestrictedCareerIds, getCurrentAdminScope } from "@/lib/adminScope";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: string | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const scope = await getCurrentAdminScope();
  if (!scope) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const restrictedCareerIds = getRestrictedCareerIds(scope);

  const teachers = await prisma.teacher.findMany({
    where: {
      isActive: true,
      ...(restrictedCareerIds
        ? {
            OR: [
              { careerId: { in: restrictedCareerIds } },
              {
                subjects: {
                  some: {
                    isActive: true,
                    careerId: { in: restrictedCareerIds },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      career: true,
      subjects: {
        where: {
          isActive: true,
          ...(restrictedCareerIds ? { careerId: { in: restrictedCareerIds } } : {}),
        },
        include: {
          career: true,
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { name: "asc" }],
  });

  const allowedCareerIdSet = restrictedCareerIds ? new Set(restrictedCareerIds) : null;

  const headers = [
    "numero_empleado",
    "nombre_docente",
    "puesto",
    "carrera_code",
    "evaluador",
    "elaborado_por",
    "plan_course_score",
    "competency_eval_score",
    "research_score",
    "tutoring_score",
    "advisory_score",
    "platform_usage_score",
    "problem_solving_score",
    "punctuality_score",
    "teamwork_score",
    "comments",
  ];

  const contexts = teachers
    .flatMap((teacher) => {
      const contextMap = new Map<string, { code: string }>();

      if (!allowedCareerIdSet || allowedCareerIdSet.has(teacher.career.id)) {
        contextMap.set(teacher.career.id, { code: teacher.career.code });
      }

      for (const subject of teacher.subjects) {
        contextMap.set(subject.career.id, { code: subject.career.code });
      }

      return Array.from(contextMap.entries()).map(([careerId, career]) => ({
        teacher,
        careerId,
        careerCode: career.code,
      }));
    })
    .sort((a, b) => {
      const careerDiff = a.careerCode.localeCompare(b.careerCode, "es");
      if (careerDiff !== 0) return careerDiff;
      const lastNameDiff = a.teacher.lastName.localeCompare(b.teacher.lastName, "es");
      if (lastNameDiff !== 0) return lastNameDiff;
      return a.teacher.name.localeCompare(b.teacher.name, "es");
    });

  const rows = contexts.map(({ teacher, careerCode }) => [
    teacher.employeeId,
    `${teacher.name} ${teacher.lastName}`,
    teacher.position,
    careerCode,
    "",
    "",
    "",
    "",
    teacher.position === "PTC" ? "" : "N/A",
    teacher.position === "PTC" ? "" : "N/A",
    teacher.position === "PTC" ? "" : "N/A",
    "",
    "",
    "",
    "",
    "",
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.map((value) => escapeCsv(value)).join(","))].join("\n");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template_evaluacion_coordinacion.csv"',
    },
  });
}
