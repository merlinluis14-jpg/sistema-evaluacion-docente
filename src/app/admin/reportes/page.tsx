import Link from "next/link";
import { BarChart2, BookOpen, Building2, Calendar, ClipboardList, Inbox, Layers3, UserCog, Users } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildInstitutionalFinalScore,
  buildStudentReport,
  getCareerHeadAverage,
  getPerformanceLevel,
  getPerformanceLevelColor,
} from "@/lib/reportes";
import {
  ALL_CAREERS_VALUE,
  OFFICIAL_DEMO_CAREER_CODE,
  isAllCareersValue,
} from "@/lib/officialScope";
import { getRestrictedCareerIds, requireAdminScope } from "@/lib/adminScope";
import { formatAcademicText } from "@/lib/text/academicText";
import ExportButtons from "./ExportButtons";

export const dynamic = "force-dynamic";

const NIVEL_TEXT: Record<string, string> = {
  emerald: "text-emerald-600",
  blue: "text-blue-600",
  amber: "text-amber-600",
  red: "text-red-600",
  slate: "text-slate-500",
};

const NIVEL_BADGE: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-50 text-slate-500",
};

type GroupSummaryAccumulator = {
  id: string;
  name: string;
  careerCode: string;
  careerName: string;
  totalEvals: number;
  teacherScores: Map<string, { referenceScore: number; studentScore: number }>;
};

type CareerSummaryAccumulator = {
  id: string;
  code: string;
  name: string;
  totalEvals: number;
  teacherScores: Map<string, { referenceScore: number; studentScore: number }>;
  groupIds: Set<string>;
};

type SubjectSummaryAccumulator = {
  id: string;
  code: string;
  name: string;
  careerId: string;
  careerCode: string;
  careerName: string;
  totalEvals: number;
  teacherNames: Set<string>;
  teacherScores: Map<string, { referenceScore: number; studentScore: number }>;
  groupIds: Set<string>;
  evals: EvaluationWithRelations[];
};

type EvaluationWithRelations = Prisma.EvaluationGetPayload<{
  include: {
    teacher: { include: { career: true } };
    student: {
      include: {
        groups: {
          include: {
            group: {
              include: {
                career: true;
                subjects: {
                  select: { subjectId: true };
                };
                _count: {
                  select: { enrollments: true };
                };
              };
            };
          };
        };
      };
    };
    subject: {
      include: {
        career: true;
      };
    };
    period: true;
  };
}>;

type AssignmentAccumulator = {
  key: string;
  teacherId: string;
  teacherName: string;
  teacherLastName: string;
  careerId: string;
  careerCode: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  groupId: string;
  groupName: string;
  expectedStudents: number;
  evals: EvaluationWithRelations[];
};

function getReferenceScore(studentAverage: number, careerHeadAverage: number) {
  return Number(
    (
      careerHeadAverage > 0
        ? (studentAverage + careerHeadAverage) / 2
        : studentAverage
    ).toFixed(2),
  );
}

function getReferenceBucket(score: number) {
  if (score <= 0) return 0;
  return Math.min(5, Math.max(1, Math.round(score)));
}

function getCompactCareerLabel(code: string, name: string) {
  const simplifiedName = formatAcademicText(name)
    .replace(/^Ingeniería en\s+/i, "")
    .replace(/^Licenciatura en\s+/i, "");
  const compactName =
    simplifiedName.length > 28 ? `${simplifiedName.slice(0, 25)}...` : simplifiedName;

  return `${code} - ${compactName}`;
}

function getCompactPeriodLabel(name: string, isActive: boolean) {
  const compactName = name
    .replace("Cuatrimestre ", "Cuat. ")
    .replace("Enero-Abril", "Ene-Abr")
    .replace("Mayo-Agosto", "May-Ago")
    .replace("Septiembre-Diciembre", "Sep-Dic");

  return isActive ? `${compactName} - Activo` : compactName;
}

function getCompactGroupLabel(name: string, careerCode: string, period: string) {
  const compactPeriod = period
    .replace("Cuatrimestre ", "")
    .replace("Enero-Abril", "Ene-Abr")
    .replace("Mayo-Agosto", "May-Ago")
    .replace("Septiembre-Diciembre", "Sep-Dic");

  return `${name} - ${careerCode} - ${compactPeriod}`;
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{
    periodoId?: string;
    carreraId?: string;
    materiaId?: string;
    grupoId?: string;
    calificacion?: string;
    orden?: string;
  }>;
}) {
  const {
    periodoId: periodoIdParam,
    carreraId: requestedCareerId,
    materiaId,
    grupoId,
    calificacion,
    orden,
  } = await searchParams;
  const scope = await requireAdminScope();
  const restrictedCareerIds = getRestrictedCareerIds(scope);

  const [periodos, carreras] = await Promise.all([
    prisma.period.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.career.findMany({
      where: {
        isActive: true,
        ...(restrictedCareerIds ? { id: { in: restrictedCareerIds } } : {}),
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const periodoActivo = periodos.find((periodo) => periodo.isActive);
  const periodoId = periodoIdParam ?? periodoActivo?.id;

  const firstCareerWithEvaluationsId =
    !scope.isGlobal && !requestedCareerId && periodoId && carreras.length > 1
      ? (
          await Promise.all(
            carreras.map(async (career) => ({
              id: career.id,
              count: await prisma.evaluation.count({
                where: {
                  periodId: periodoId,
                  subject: {
                    careerId: career.id,
                  },
                },
              }),
            })),
          )
        ).find((career) => career.count > 0)?.id
      : undefined;

  const allowAllCareers = scope.isGlobal && carreras.length > 1;
  const defaultCareer = scope.isGlobal
    ? carreras.find((career) => career.code === OFFICIAL_DEMO_CAREER_CODE) ?? carreras[0] ?? null
    : carreras.find((career) => career.id === firstCareerWithEvaluationsId) ?? carreras[0] ?? null;
  const requestedCareerIsAccessible = carreras.some((career) => career.id === requestedCareerId);
  const showAllCareers =
    allowAllCareers && (!requestedCareerId || isAllCareersValue(requestedCareerId));
  const carreraId = showAllCareers
    ? undefined
    : (requestedCareerIsAccessible ? requestedCareerId : undefined) || defaultCareer?.id;
  const selectedCareerValue = showAllCareers ? ALL_CAREERS_VALUE : carreraId ?? "";
  const evaluationCareerFilter = carreraId
    ? { careerId: carreraId }
    : restrictedCareerIds
      ? { careerId: { in: restrictedCareerIds } }
      : undefined;
  const subjectListWhere = carreraId
    ? { careerId: carreraId }
    : restrictedCareerIds
      ? { careerId: { in: restrictedCareerIds } }
      : {};
  const groupListWhere = carreraId
    ? { careerId: carreraId }
    : restrictedCareerIds
      ? { careerId: { in: restrictedCareerIds } }
      : undefined;

  const [materias, grupos] = await Promise.all([
    prisma.subject.findMany({
      where: {
        isActive: true,
        ...subjectListWhere,
      },
      orderBy: { name: "asc" },
      include: { teacher: true },
    }),
    prisma.group.findMany({
      where: groupListWhere,
      orderBy: { name: "asc" },
      include: { career: true },
    }),
  ]);

  const evaluaciones = await prisma.evaluation.findMany({
    where: {
      ...(periodoId ? { periodId: periodoId } : {}),
      ...(evaluationCareerFilter ? { subject: evaluationCareerFilter } : {}),
      ...(materiaId ? { subjectId: materiaId } : {}),
      ...(grupoId
        ? {
            student: {
              groups: { some: { groupId: grupoId } },
            },
          }
        : {}),
    },
    include: {
      teacher: { include: { career: true } },
      student: {
        include: {
          groups: {
            include: {
              group: {
                include: {
                  career: true,
                  subjects: {
                    select: { subjectId: true },
                  },
                  _count: {
                    select: { enrollments: true },
                  },
                },
              },
            },
          },
        },
      },
      subject: {
        include: {
          career: true,
        },
      },
      period: true,
    },
  });

  const docenteMap = new Map<
    string,
    {
      teacher: (typeof evaluaciones)[number]["teacher"];
      career: (typeof evaluaciones)[number]["subject"]["career"];
      evals: typeof evaluaciones;
    }
  >();

  for (const evaluation of evaluaciones) {
    const key = `${evaluation.teacherId}:${evaluation.subject.careerId}`;
    if (!docenteMap.has(key)) {
      docenteMap.set(key, {
        teacher: evaluation.teacher,
        career: evaluation.subject.career,
        evals: [],
      });
    }
    docenteMap.get(key)!.evals.push(evaluation);
  }

  const teacherIds = [...new Set(Array.from(docenteMap.values()).map((item) => item.teacher.id))];
  const contextCareerIds = [...new Set(Array.from(docenteMap.values()).map((item) => item.career.id))];
  const careerHeadEvaluations = teacherIds.length > 0 && contextCareerIds.length > 0 && periodoId
    ? await prisma.careerHeadEvaluation.findMany({
        where: {
          periodId: periodoId,
          teacherId: { in: teacherIds },
          careerId: { in: contextCareerIds },
        },
      })
    : [];

  const careerHeadMap = new Map(
    careerHeadEvaluations.map((evaluation) => [`${evaluation.teacherId}:${evaluation.careerId}`, evaluation]),
  );

  const reporteDocentesBase = Array.from(docenteMap.values()).map(({ teacher, career, evals }) => {
    const { promedios } = buildStudentReport(evals);
    const careerHeadEvaluation = careerHeadMap.get(`${teacher.id}:${career.id}`) ?? null;
    const careerHeadAvg = getCareerHeadAverage(careerHeadEvaluation, teacher.position);
    const institutionalScore = buildInstitutionalFinalScore(careerHeadAvg, promedios.global);
    const referenceScore = getReferenceScore(promedios.global, careerHeadAvg);
    const nivel = getPerformanceLevel(promedios.global);
    const nivelColor = getPerformanceLevelColor(promedios.global);

    return {
      teacher,
      contextCareer: {
        ...career,
        name: formatAcademicText(career.name),
      },
      totalEvals: evals.length,
      facAvg: promedios.fac.toFixed(2),
      habAvg: promedios.hab.toFixed(2),
      medAvg: promedios.med.toFixed(2),
      autoAvg: promedios.auto.toFixed(2),
      globalAvg: promedios.global.toFixed(2),
      careerHeadAvg: careerHeadAvg.toFixed(2),
      institutionalScore: institutionalScore.toFixed(2),
      referenceScore: referenceScore.toFixed(2),
      referenceBucket: getReferenceBucket(referenceScore),
      careerHeadEvaluation: careerHeadEvaluation
        ? {
            evaluatorName: careerHeadEvaluation.evaluatorName,
            comments: careerHeadEvaluation.comments,
            planCourseScore: careerHeadEvaluation.planCourseScore,
            competencyEvalScore: careerHeadEvaluation.competencyEvalScore,
            researchScore: careerHeadEvaluation.researchScore,
            tutoringScore: careerHeadEvaluation.tutoringScore,
            advisoryScore: careerHeadEvaluation.advisoryScore,
            platformUsageScore: careerHeadEvaluation.platformUsageScore,
            problemSolvingScore: careerHeadEvaluation.problemSolvingScore,
            punctualityScore: careerHeadEvaluation.punctualityScore,
            teamworkScore: careerHeadEvaluation.teamworkScore,
          }
        : null,
      nivel,
      nivelColor,
      materias: [...new Set(evals.map((evaluation) => formatAcademicText(evaluation.subject.name)))],
    };
  });

  const scoreFilter = Number(calificacion || "");
  const sortOrder = orden === "asc" ? "asc" : "desc";

  const teacherReportMap = new Map(
    reporteDocentesBase.map((docente) => [
      `${docente.teacher.id}:${docente.contextCareer.id}`,
      {
        referenceScore: parseFloat(docente.referenceScore),
        studentScore: parseFloat(docente.globalAvg),
        careerHeadAvg: parseFloat(docente.careerHeadAvg),
      },
    ]),
  );

  const assignmentSummaryMap = new Map<string, AssignmentAccumulator>();
  const groupSummaryMap = new Map<string, GroupSummaryAccumulator>();
  const careerSummaryMap = new Map<string, CareerSummaryAccumulator>();
  const subjectSummaryMap = new Map<string, SubjectSummaryAccumulator>();

  for (const evaluation of evaluaciones) {
    const teacherScore = teacherReportMap.get(`${evaluation.teacherId}:${evaluation.subject.careerId}`);
    if (!teacherScore) {
      continue;
    }

    const careerId = evaluation.subject.career.id;
    let careerSummary = careerSummaryMap.get(careerId);
    if (!careerSummary) {
      careerSummary = {
        id: careerId,
        code: evaluation.subject.career.code,
        name: formatAcademicText(evaluation.subject.career.name),
        totalEvals: 0,
        teacherScores: new Map(),
        groupIds: new Set(),
      };
      careerSummaryMap.set(careerId, careerSummary);
    }

    careerSummary.totalEvals += 1;
    careerSummary.teacherScores.set(`${evaluation.teacherId}:${careerId}`, teacherScore);

    let subjectSummary = subjectSummaryMap.get(evaluation.subjectId);
    if (!subjectSummary) {
      subjectSummary = {
        id: evaluation.subjectId,
        code: evaluation.subject.code,
        name: formatAcademicText(evaluation.subject.name),
        careerId,
        careerCode: evaluation.subject.career.code,
        careerName: formatAcademicText(evaluation.subject.career.name),
        totalEvals: 0,
        teacherNames: new Set(),
        teacherScores: new Map(),
        groupIds: new Set(),
        evals: [],
      };
      subjectSummaryMap.set(evaluation.subjectId, subjectSummary);
    }

    subjectSummary.totalEvals += 1;
    subjectSummary.teacherNames.add(`${evaluation.teacher.name} ${evaluation.teacher.lastName}`);
    subjectSummary.teacherScores.set(`${evaluation.teacherId}:${careerId}`, teacherScore);
    subjectSummary.evals.push(evaluation);

    const matchingEnrollments = evaluation.student.groups.filter((enrollment) =>
      enrollment.group.subjects.some((groupSubject) => groupSubject.subjectId === evaluation.subjectId),
    );

    for (const enrollment of matchingEnrollments) {
      const group = enrollment.group;
      careerSummary.groupIds.add(group.id);
      subjectSummary.groupIds.add(group.id);

      const assignmentKey = `${evaluation.teacherId}:${evaluation.subjectId}:${group.id}`;
      let assignmentSummary = assignmentSummaryMap.get(assignmentKey);
      if (!assignmentSummary) {
        assignmentSummary = {
          key: assignmentKey,
          teacherId: evaluation.teacherId,
          teacherName: evaluation.teacher.name,
          teacherLastName: evaluation.teacher.lastName,
          careerId: evaluation.subject.career.id,
          careerCode: evaluation.subject.career.code,
          subjectId: evaluation.subjectId,
          subjectName: formatAcademicText(evaluation.subject.name),
          subjectCode: evaluation.subject.code,
          groupId: group.id,
          groupName: group.name,
          expectedStudents: group._count.enrollments,
          evals: [],
        };
        assignmentSummaryMap.set(assignmentKey, assignmentSummary);
      }
      assignmentSummary.evals.push(evaluation);

      let groupSummary = groupSummaryMap.get(group.id);
      if (!groupSummary) {
        groupSummary = {
          id: group.id,
          name: group.name,
          careerCode: group.career.code,
          careerName: formatAcademicText(group.career.name),
          totalEvals: 0,
          teacherScores: new Map(),
        };
        groupSummaryMap.set(group.id, groupSummary);
      }

      groupSummary.totalEvals += 1;
      groupSummary.teacherScores.set(`${evaluation.teacherId}:${careerId}`, teacherScore);
    }
  }

  const groupSummaries = Array.from(groupSummaryMap.values())
    .map((group) => {
      const teacherScores = Array.from(group.teacherScores.values());
      const referenceAverage = teacherScores.length > 0
        ? teacherScores.reduce((acc, score) => acc + score.referenceScore, 0) / teacherScores.length
        : 0;
      const studentAverage = teacherScores.length > 0
        ? teacherScores.reduce((acc, score) => acc + score.studentScore, 0) / teacherScores.length
        : 0;

      return {
        ...group,
        totalTeachers: group.teacherScores.size,
        referenceAverage: referenceAverage.toFixed(2),
        studentAverage: studentAverage.toFixed(2),
      };
    })
    .sort((a, b) => Number(b.referenceAverage) - Number(a.referenceAverage));

  const careerSummaries = Array.from(careerSummaryMap.values())
    .map((career) => {
      const teacherScores = Array.from(career.teacherScores.values());
      const referenceAverage = teacherScores.length > 0
        ? teacherScores.reduce((acc, score) => acc + score.referenceScore, 0) / teacherScores.length
        : 0;
      const studentAverage = teacherScores.length > 0
        ? teacherScores.reduce((acc, score) => acc + score.studentScore, 0) / teacherScores.length
        : 0;

      return {
        ...career,
        totalTeachers: career.teacherScores.size,
        totalGroups: career.groupIds.size,
        referenceAverage: referenceAverage.toFixed(2),
        studentAverage: studentAverage.toFixed(2),
      };
    })
    .sort((a, b) => Number(b.referenceAverage) - Number(a.referenceAverage));

  const subjectSummaries = Array.from(subjectSummaryMap.values())
    .map((subject) => {
      const { promedios } = buildStudentReport(subject.evals);
      const teacherScores = Array.from(subject.teacherScores.values());
      const referenceAverage = teacherScores.length > 0
        ? teacherScores.reduce((acc, score) => acc + score.referenceScore, 0) / teacherScores.length
        : promedios.global;

      return {
        ...subject,
        totalTeachers: subject.teacherNames.size,
        teacherLabel: Array.from(subject.teacherNames).slice(0, 2).join(", "),
        studentAverage: promedios.global.toFixed(2),
        referenceAverage: referenceAverage.toFixed(2),
        totalGroups: subject.groupIds.size,
      };
    })
    .sort((a, b) => Number(b.referenceAverage) - Number(a.referenceAverage));

  const assignmentSummaries = Array.from(assignmentSummaryMap.values())
    .map((assignment) => {
      const { promedios } = buildStudentReport(assignment.evals);
      const teacherScore = teacherReportMap.get(`${assignment.teacherId}:${assignment.careerId}`);
      const referenceAverage = getReferenceScore(
        promedios.global,
        teacherScore?.careerHeadAvg ?? 0,
      );
      const progress = assignment.expectedStudents > 0
        ? Number(((assignment.evals.length / assignment.expectedStudents) * 100).toFixed(1))
        : 0;

      const progressLabel = progress >= 80
        ? "Alto avance"
        : progress >= 40
          ? "En seguimiento"
          : "Bajo avance";
      const progressTone = progress >= 80
        ? "bg-emerald-50 text-emerald-700"
        : progress >= 40
          ? "bg-amber-50 text-amber-700"
          : "bg-red-50 text-red-700";

      return {
        ...assignment,
        totalEvals: assignment.evals.length,
        studentAverage: promedios.global.toFixed(2),
        referenceAverage: referenceAverage.toFixed(2),
        progress: progress.toFixed(1),
        progressLabel,
        progressTone,
      };
    })
    .sort((a, b) => {
      const progressDiff = Number(a.progress) - Number(b.progress);
      if (progressDiff !== 0) return progressDiff;
      return a.teacherLastName.localeCompare(b.teacherLastName, "es");
    });

  const teacherGroupsMap = new Map<string, string[]>();
  for (const assignment of assignmentSummaries) {
    const teacherKey = `${assignment.teacherId}:${assignment.careerId}`;
    const currentGroups = teacherGroupsMap.get(teacherKey) ?? [];
    if (!currentGroups.includes(assignment.groupName)) {
      currentGroups.push(assignment.groupName);
      currentGroups.sort((a, b) => a.localeCompare(b, "es"));
      teacherGroupsMap.set(teacherKey, currentGroups);
    }
  }

  const reporteDocentes = reporteDocentesBase
    .map((docente) => ({
      ...docente,
      grupos: teacherGroupsMap.get(`${docente.teacher.id}:${docente.contextCareer.id}`) ?? [],
    }))
    .filter((docente) => (scoreFilter ? docente.referenceBucket === scoreFilter : true))
    .sort((a, b) => {
      const difference = parseFloat(b.referenceScore) - parseFloat(a.referenceScore);
      return sortOrder === "asc" ? -difference : difference;
    });

  const totalEvals = evaluaciones.length;
  const totalDocentes = reporteDocentes.length;
  const periodoNombre = periodos.find((periodo) => periodo.id === periodoId)?.name ?? "Todos";
  const materiaNombre = materias.find((materia) => materia.id === materiaId)?.name;
  const grupoNombre = grupos.find((group) => group.id === grupoId);
  const hasFilters = !!(periodoIdParam || requestedCareerId || materiaId || grupoId || calificacion || orden);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-tight text-slate-800 sm:text-3xl">
            Reportes de <span className="text-blue-600">Evaluación</span>
          </h1>
          <p className="mt-1 break-words text-sm text-slate-400">
            Consulta consolidada de resultados por periodo, carrera, grupo y docente. {periodoNombre}
            {materiaNombre ? ` - ${materiaNombre}` : ""}
            {grupoNombre ? ` - Grupo ${grupoNombre.name} (${grupoNombre.career.code})` : ""}
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2 justify-stretch sm:w-auto sm:justify-end">
          {scope.isGlobal ? (
            <Link
            href="/admin/reportes/importar-jefatura"
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 sm:w-auto"
          >
            Importar Eval. Coordinación
            </Link>
          ) : null}
          <ExportButtons
            data={reporteDocentes}
            periodo={periodoNombre}
            canExportInstitutional={Boolean(periodoId)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <form className="flex gap-3 flex-wrap items-end">
          <div className="w-full sm:flex-1 sm:min-w-[220px]">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Período</label>
            <select
              name="periodoId"
              defaultValue={periodoId}
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todos los períodos</option>
              {periodos.map((periodo) => (
                <option key={periodo.id} value={periodo.id}>
                  {getCompactPeriodLabel(periodo.name, periodo.isActive)}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:flex-1 sm:min-w-[220px]">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Carrera</label>
            <select
              name="carreraId"
              defaultValue={selectedCareerValue}
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {allowAllCareers ? (
                <option value={ALL_CAREERS_VALUE}>Todas las carreras</option>
              ) : null}
              {carreras.map((career) => (
                <option key={career.id} value={career.id}>
                  {getCompactCareerLabel(career.code, career.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:flex-1 sm:min-w-[220px]">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Materia</label>
            <select
              name="materiaId"
              defaultValue={materiaId}
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todas las materias</option>
              {materias.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {formatAcademicText(subject.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:flex-1 sm:min-w-[220px]">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Grupo</label>
            <select
              name="grupoId"
              defaultValue={grupoId}
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todos los grupos</option>
              {grupos.map((group) => (
                <option key={group.id} value={group.id}>
                  {getCompactGroupLabel(group.name, group.career.code, group.period)}
                </option>
              ))}
            </select>
          </div>

          <div className="w-[calc(50%-0.375rem)] sm:w-auto">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Calif. /5</label>
            <select
              name="calificacion"
              defaultValue={calificacion ?? ""}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todas</option>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </div>

          <div className="w-[calc(50%-0.375rem)] sm:w-auto">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Orden</label>
            <select
              name="orden"
              defaultValue={sortOrder}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="desc">Mayor a menor</option>
              <option value="asc">Menor a mayor</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-800 sm:w-auto"
          >
            Filtrar
          </button>

          {hasFilters && (
            <Link
              href="/admin/reportes"
              className="w-full rounded-xl bg-slate-100 px-5 py-2.5 text-center text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 sm:w-auto"
            >
              Limpiar
            </Link>
          )}
        </form>

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Puedes consultar todo el periodo o aplicar filtros por carrera, materia
          y grupo para revisar resultados mas puntuales.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <ClipboardList className="w-5 h-5 mb-1 text-blue-500" />
          <p className="text-2xl font-black text-blue-700">{totalEvals}</p>
          <p className="text-xs font-bold text-blue-600 mt-0.5">Total evaluaciones</p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <UserCog className="w-5 h-5 mb-1 text-blue-500" />
          <p className="text-2xl font-black text-blue-700">{totalDocentes}</p>
          <p className="text-xs font-bold text-blue-600 mt-0.5">Docentes evaluados</p>
        </div>

        <div className={`rounded-2xl p-5 ${periodoActivo ? "bg-blue-50 border border-blue-100" : "bg-slate-50 border border-slate-100"}`}>
          <Calendar className={`w-5 h-5 mb-1 ${periodoActivo ? "text-blue-500" : "text-slate-400"}`} />
          <p className={`text-2xl font-black ${periodoActivo ? "text-blue-700" : "text-slate-600"}`}>
            {periodoActivo ? "Sí" : "No"}
          </p>
          <p className={`text-xs font-bold mt-0.5 ${periodoActivo ? "text-blue-600" : "text-slate-500"}`}>
            Período activo
          </p>
        </div>

        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
          <BarChart2 className="w-5 h-5 mb-1 text-violet-500" />
          <p className="text-2xl font-black text-violet-700">
            {reporteDocentes.length > 0
              ? (
                  reporteDocentes.reduce((acc, docente) => acc + parseFloat(docente.referenceScore), 0) / reporteDocentes.length
                ).toFixed(2)
              : "-"}
          </p>
          <p className="text-xs font-bold text-violet-600 mt-0.5">Promedio ref. /5</p>
        </div>
      </div>

      {evaluaciones.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-700">Seguimiento por Grupo y Materia</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Control operativo por asignación docente. Muestra avance de evaluación y promedio total por grupo.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Docente</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Materia</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Grupo</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Esperados</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Recibidas</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Avance</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnos /5</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Total /5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assignmentSummaries.map((assignment) => (
                  <tr key={assignment.key} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {assignment.teacherName} {assignment.teacherLastName}
                        </p>
                        <p className="text-xs text-slate-400">{assignment.careerCode}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <div>
                          <p className="font-bold text-slate-700 text-sm">{assignment.subjectName}</p>
                          <p className="text-xs text-slate-400">{assignment.subjectCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {assignment.groupName}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-slate-600">{assignment.expectedStudents}</td>
                    <td className="px-4 py-4 text-center font-bold text-slate-600">{assignment.totalEvals}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-black text-slate-700">{assignment.progress}%</span>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${assignment.progressTone}`}>
                          {assignment.progressLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-black text-indigo-600">{assignment.studentAverage}</td>
                    <td className="px-4 py-4 text-center font-black text-blue-700">{assignment.referenceAverage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {evaluaciones.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h2 className="font-bold text-slate-700">Resumen por Materia</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Concentrado por materia con grupos atendidos, docentes involucrados y promedio total /5.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Materia</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Carrera</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Grupos</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Docentes</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Evals.</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnos /5</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Total /5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subjectSummaries.map((subject) => (
                  <tr key={subject.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{subject.name}</p>
                        <p className="text-xs text-slate-400">{subject.code}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {subject.teacherLabel}
                          {subject.totalTeachers > 2 ? ` +${subject.totalTeachers - 2}` : ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-indigo-50 text-indigo-700 font-black text-xs px-2 py-1 rounded-lg">
                        {subject.careerCode}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">{subject.careerName}</p>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-slate-600">{subject.totalGroups}</td>
                    <td className="px-4 py-4 text-center font-bold text-slate-600">{subject.totalTeachers}</td>
                    <td className="px-4 py-4 text-center font-bold text-slate-600">{subject.totalEvals}</td>
                    <td className="px-4 py-4 text-center font-black text-indigo-600">{subject.studentAverage}</td>
                    <td className="px-4 py-4 text-center font-black text-blue-700">{subject.referenceAverage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {evaluaciones.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers3 className="w-4 h-4 text-blue-500" />
                <h2 className="font-bold text-slate-700">Resumen por Grupo</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Promedio de referencia /5 por grupo considerando a los docentes evaluados.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Grupo</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Evals.</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Docentes</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnos /5</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Total /5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {groupSummaries.map((group) => (
                    <tr key={group.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{group.name}</p>
                            <p className="text-xs text-slate-400">{group.careerCode} - {group.careerName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-600">{group.totalEvals}</td>
                      <td className="px-4 py-4 text-center font-bold text-slate-600">{group.totalTeachers}</td>
                      <td className="px-4 py-4 text-center font-black text-indigo-600">{group.studentAverage}</td>
                      <td className="px-4 py-4 text-center font-black text-blue-700">{group.referenceAverage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-500" />
                <h2 className="font-bold text-slate-700">Resumen por Carrera</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Vista concentrada por carrera con grupos atendidos y calificación total promedio.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Carrera</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Grupos</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Docentes</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Evals.</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Total /5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {careerSummaries.map((career) => (
                    <tr key={career.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{career.code}</p>
                          <p className="text-xs text-slate-400">{formatAcademicText(career.name)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-600">{career.totalGroups}</td>
                      <td className="px-4 py-4 text-center font-bold text-slate-600">{career.totalTeachers}</td>
                      <td className="px-4 py-4 text-center font-bold text-slate-600">{career.totalEvals}</td>
                      <td className="px-4 py-4 text-center font-black text-violet-700">{career.referenceAverage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-700">Resultados por Docente</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ordenados por calificación de referencia /5. Si existe evaluación de jefatura, se promedia con la evaluación de alumnos.
          </p>
        </div>

        {reporteDocentes.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className="w-12 h-12 mb-3 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-500">No hay resultados para la selección actual</p>
            <p className="text-sm text-slate-400">
              También puedes limpiar o ajustar los filtros para revisar otra carrera, materia o grupo.
            </p>
            <p className="text-sm text-slate-400 mt-1">Selecciona un período con evaluaciones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Docente</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Carrera</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Evals.</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-blue-400 uppercase tracking-wider">Fac. /4</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-indigo-400 uppercase tracking-wider">Hab. /5</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-violet-400 uppercase tracking-wider">Med. /5</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Calif. /5</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Nivel</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {reporteDocentes.map((docente, index) => (
                  <tr
                    key={`${docente.teacher.id}:${docente.contextCareer.id}`}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                          index === 0
                            ? "bg-amber-100 text-amber-700"
                            : index === 1
                              ? "bg-slate-100 text-slate-600"
                              : index === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-slate-50 text-slate-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                          {docente.teacher.name[0]}{docente.teacher.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {docente.teacher.name} {docente.teacher.lastName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {docente.materias.slice(0, 2).join(", ")}
                            {docente.materias.length > 2 ? ` +${docente.materias.length - 2}` : ""}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {docente.grupos.length > 0 ? (
                              <>
                                {docente.grupos.slice(0, 3).map((groupName) => (
                                  <span
                                    key={`${docente.teacher.id}-${docente.contextCareer.id}-${groupName}`}
                                    className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[11px] font-bold"
                                  >
                                    {groupName}
                                  </span>
                                ))}
                                {docente.grupos.length > 3 && (
                                  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[11px] font-bold">
                                    +{docente.grupos.length - 3}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">Sin grupos detectados</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="bg-indigo-50 text-indigo-700 font-black text-xs px-2 py-1 rounded-lg">
                        {docente.contextCareer.code}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-slate-600 text-sm">{docente.totalEvals}</span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="font-black text-blue-600">{docente.facAvg}</span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="font-black text-indigo-600">{docente.habAvg}</span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="font-black text-violet-600">{docente.medAvg}</span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className={`font-black text-lg ${NIVEL_TEXT[docente.nivelColor] ?? "text-slate-500"}`}>
                        {docente.referenceScore}
                      </span>
                      <p className="text-[11px] font-bold text-slate-400 mt-1">
                        Banda {docente.referenceBucket || "-"}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${NIVEL_BADGE[docente.nivelColor] ?? "bg-slate-50 text-slate-500"}`}>
                        {docente.nivel}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/reportes/${docente.teacher.id}?${[
                          periodoId ? `periodoId=${periodoId}` : "",
                          `careerId=${docente.contextCareer.id}`,
                        ].filter(Boolean).join("&")}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

