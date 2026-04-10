import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  ClipboardCheck,
  Inbox,
  Lightbulb,
  Monitor,
  Target,
  Users,
} from "lucide-react";

import CareerHeadEvaluationForm from "./CareerHeadEvaluationForm";
import ExportTeacherPdf from "./ExportTeacherPdf";
import GraficasDetalle from "./GraficasDetalle";
import { getRestrictedCareerIds, requireAdminScope } from "@/lib/adminScope";
import { prisma } from "@/lib/prisma";
import {
  buildStudentReport,
  getPerformanceLevel,
  getTeacherPositionLabel,
} from "@/lib/reportes";

export const dynamic = "force-dynamic";

const COLOR_CARD: Record<
  string,
  { bg: string; border: string; icon: string; value: string; label: string }
> = {
  blue: {
    bg: "bg-[#1B2A6B]/5",
    border: "border-[#1B2A6B]/10",
    icon: "text-[#1B2A6B]",
    value: "text-[#1B2A6B]",
    label: "text-[#7A7468]",
  },
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    icon: "text-indigo-500",
    value: "text-indigo-700",
    label: "text-indigo-400",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-100",
    icon: "text-violet-500",
    value: "text-violet-700",
    label: "text-violet-400",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    icon: "text-emerald-500",
    value: "text-emerald-700",
    label: "text-emerald-400",
  },
};

type SearchParams = {
  periodoId?: string;
  careerId?: string;
};

export default async function ReporteDocenteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { teacherId } = await params;
  const { periodoId: periodoIdParam, careerId: careerIdParam } = await searchParams;
  const scope = await requireAdminScope();
  const restrictedCareerIds = getRestrictedCareerIds(scope);

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      career: true,
      subjects: {
        where: { isActive: true },
        include: {
          career: true,
          groups: {
            include: {
              group: {
                include: {
                  career: true,
                  _count: { select: { enrollments: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!teacher) notFound();

  const periodos = await prisma.period.findMany({
    orderBy: { createdAt: "desc" },
  });

  const periodoActivo = periodos.find((periodo) => periodo.isActive);
  const periodoId = periodoIdParam ?? periodoActivo?.id;
  const periodo = periodoId
    ? periodos.find((periodoItem) => periodoItem.id === periodoId) ?? null
    : periodoActivo ?? null;

  const availableCareersMap = new Map<string, { id: string; code: string; name: string }>();
  availableCareersMap.set(teacher.career.id, {
    id: teacher.career.id,
    code: teacher.career.code,
    name: teacher.career.name,
  });

  for (const subject of teacher.subjects) {
    availableCareersMap.set(subject.career.id, {
      id: subject.career.id,
      code: subject.career.code,
      name: subject.career.name,
    });
  }

  const availableCareers = Array.from(availableCareersMap.values())
    .filter((career) => !restrictedCareerIds || restrictedCareerIds.includes(career.id))
    .sort((a, b) => {
    if (a.id === teacher.career.id) return -1;
    if (b.id === teacher.career.id) return 1;
    return a.code.localeCompare(b.code, "es");
  });

  if (availableCareers.length === 0) {
    notFound();
  }

  const selectedCareerId = availableCareers.some((career) => career.id === careerIdParam)
    ? careerIdParam!
    : availableCareers[0]?.id ?? teacher.career.id;

  const selectedCareer = availableCareers.find((career) => career.id === selectedCareerId) ?? {
    id: teacher.career.id,
    code: teacher.career.code,
    name: teacher.career.name,
  };

  const careerHeadEvaluation = periodoId
    ? await prisma.careerHeadEvaluation.findUnique({
        where: {
          teacherId_careerId_periodId: {
            teacherId,
            careerId: selectedCareer.id,
            periodId: periodoId,
          },
        },
      })
    : null;

  const evaluaciones = await prisma.evaluation.findMany({
    where: {
      teacherId,
      ...(periodoId ? { periodId: periodoId } : {}),
      subject: { careerId: selectedCareer.id },
    },
    include: {
      subject: {
        include: { career: true },
      },
      student: {
        include: {
          groups: {
            include: {
              group: {
                include: {
                  career: true,
                  subjects: { select: { subjectId: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const subjectAssignments = teacher.subjects
    .filter((subject) => subject.careerId === selectedCareer.id)
    .flatMap((subject) =>
      subject.groups
        .filter((groupSubject) => groupSubject.group.careerId === selectedCareer.id)
        .map((groupSubject) => ({
          key: `${subject.id}:${groupSubject.group.id}`,
          subjectId: subject.id,
          subjectCode: subject.code,
          subjectName: subject.name,
          groupId: groupSubject.group.id,
          groupName: groupSubject.group.name,
        })),
    )
    .sort((a, b) => {
      const groupDiff = a.groupName.localeCompare(b.groupName, "es");
      if (groupDiff !== 0) return groupDiff;
      return a.subjectName.localeCompare(b.subjectName, "es");
    });

  const assignmentSummaryMap = new Map<
    string,
    {
      key: string;
      subjectCode: string;
      subjectName: string;
      groupName: string;
      evaluationsCount: number;
      studentAverage: string;
      evals: typeof evaluaciones;
    }
  >();

  for (const assignment of subjectAssignments) {
    assignmentSummaryMap.set(assignment.key, {
      key: assignment.key,
      subjectCode: assignment.subjectCode,
      subjectName: assignment.subjectName,
      groupName: assignment.groupName,
      evaluationsCount: 0,
      studentAverage: "0.00",
      evals: [],
    });
  }

  for (const evaluation of evaluaciones) {
    const matchingGroups = evaluation.student.groups.filter(
      (enrollment) =>
        enrollment.group.careerId === selectedCareer.id &&
        enrollment.group.subjects.some((groupSubject) => groupSubject.subjectId === evaluation.subjectId),
    );

    for (const enrollment of matchingGroups) {
      const key = `${evaluation.subjectId}:${enrollment.group.id}`;
      const current = assignmentSummaryMap.get(key);

      if (!current) {
        assignmentSummaryMap.set(key, {
          key,
          subjectCode: evaluation.subject.code,
          subjectName: evaluation.subject.name,
          groupName: enrollment.group.name,
          evaluationsCount: 1,
          studentAverage: "0.00",
          evals: [evaluation],
        });
      } else {
        current.evaluationsCount += 1;
        current.evals.push(evaluation);
      }
    }
  }

  for (const summary of assignmentSummaryMap.values()) {
    const studentAverage = buildStudentReport(summary.evals).promedios.global;
    summary.studentAverage = studentAverage.toFixed(2);
  }

  const assignmentOverview = Array.from(assignmentSummaryMap.values()).map((summary) => ({
    key: summary.key,
    subjectCode: summary.subjectCode,
    subjectName: summary.subjectName,
    groupName: summary.groupName,
    evaluationsCount: summary.evaluationsCount,
    studentAverage: summary.studentAverage,
  }));

  const n = evaluaciones.length;
  const studentReport = buildStudentReport(evaluaciones);
  const {
    facilitador,
    habilidades,
    medios,
    autoevaluacion,
    teoriaPractica,
    promedios: {
      fac: promedioFac,
      hab: promedioHab,
      med: promedioMed,
      auto: promedioAuto,
      global: promedioGlobal,
    },
  } = studentReport;

  const nivel = getPerformanceLevel(promedioGlobal);
  const materias = [
    ...new Map(evaluaciones.map((evaluation) => [evaluation.subjectId, evaluation.subject])).values(),
  ];
  const baseQuery = periodoId ? `periodoId=${periodoId}` : "";

  return (
    <div className="relative mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-x-6 top-4 -z-10 h-72 rounded-[2rem] bg-gradient-to-b from-blue-50/70 via-slate-50 to-transparent blur-2xl sm:inset-x-10" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/admin/reportes${periodoId ? `?periodoId=${periodoId}` : ""}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft size={15} />
          Volver a Reportes
        </Link>

        {n > 0 && (
          <ExportTeacherPdf
            teacher={{
              ...teacher,
              career: selectedCareer,
            }}
            periodo={periodo?.name ?? "Historico Total"}
            evaluacionesCount={n}
            promedios={{
              fac: promedioFac,
              hab: promedioHab,
              med: promedioMed,
              auto: promedioAuto,
              global: promedioGlobal,
            }}
            nivel={nivel}
            facilitador={facilitador}
            habilidades={habilidades}
            medios={medios}
            autoevaluacion={autoevaluacion}
            teoriaPractica={teoriaPractica}
          />
        )}
      </div>

      <div className="relative overflow-hidden space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.22)] backdrop-blur sm:p-6">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-20 w-20 rounded-full bg-slate-100 blur-2xl" />

        <div className="relative z-10 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          Reporte del Docente
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1B2A6B] to-[#2A3F9F] text-lg font-black text-white">
              {teacher.name[0]}
              {teacher.lastName[0]}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-800 sm:text-2xl">
                  {teacher.name} {teacher.lastName}
                </h1>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">
                  {selectedCareer.code}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">{selectedCareer.name}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {getTeacherPositionLabel(teacher.position)}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {teacher.employeeId}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {periodo?.name ?? "Sin período"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {n} evaluación{n !== 1 ? "es" : ""} de alumnos
                </span>
              </div>
            </div>
          </div>

          <div className="min-w-[144px] rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center shadow-sm">
            <p className="text-3xl font-black text-[#1B2A6B]">{promedioGlobal.toFixed(2)}</p>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Promedio Global
            </p>
            <span
              className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                nivel === "Excelente"
                  ? "bg-emerald-100 text-emerald-700"
                  : nivel === "Bueno"
                    ? "bg-blue-100 text-[#1B2A6B]"
                    : nivel === "Regular"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
              }`}
            >
              {nivel}
            </span>
          </div>
        </div>

        {availableCareers.length > 1 && (
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Cambiar Contexto de Carrera
            </p>
            <div className="flex flex-wrap gap-2">
              {availableCareers.map((career) => {
                const href = `/admin/reportes/${teacher.id}?${[baseQuery, `careerId=${career.id}`]
                  .filter(Boolean)
                  .join("&")}`;
                const selected = career.id === selectedCareer.id;

                return (
                  <Link
                    key={career.id}
                    href={href}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {career.code}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {n === 0 && (
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <p className="font-bold text-amber-800">
            Aún no hay evaluaciones de alumnos en esta carrera para este período.
          </p>
          <p className="mt-1 text-sm text-amber-700">
            La coordinación puede capturar su evaluación institucional, pero el promedio combinado se verá
            completo cuando existan resultados de alumnos en este contexto.
          </p>
        </div>
      )}

      <CareerHeadEvaluationForm
        teacherId={teacher.id}
        careerId={selectedCareer.id}
        careerCode={selectedCareer.code}
        careerName={selectedCareer.name}
        teacherName={`${teacher.name} ${teacher.lastName}`}
        periodId={periodoId}
        periodName={periodo?.name ?? "Sin período"}
        position={teacher.position}
        initialEvaluation={careerHeadEvaluation}
        assignmentOverview={assignmentOverview}
      />

      {n > 0 ? (
        <>
          <section className="space-y-5 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.22)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  Resumen Estudiantil
                </div>
                <h2 className="mt-3 text-xl font-black text-slate-800">
                  Síntesis de resultados capturados por los alumnos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Este bloque concentra los promedios por sección y las materias evaluadas en el
                  contexto seleccionado.
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-center shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-wide text-blue-500">
                  Evaluaciones de alumnos
                </p>
                <p className="mt-1 text-2xl font-black text-blue-700">{n}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Facilitador", valor: promedioFac, max: 4, color: "blue", Icon: Target },
                { label: "Habilidades", valor: promedioHab, max: 5, color: "indigo", Icon: Lightbulb },
                { label: "Medios Did.", valor: promedioMed, max: 5, color: "violet", Icon: Monitor },
                { label: "Autoevaluac.", valor: promedioAuto, max: 5, color: "emerald", Icon: ClipboardCheck },
              ].map(({ label, valor, max, color, Icon }) => {
                const card = COLOR_CARD[color];

                return (
                  <div key={label} className={`${card.bg} rounded-2xl border ${card.border} p-4 text-center`}>
                    <Icon className={`mx-auto mb-1 h-5 w-5 ${card.icon}`} />
                    <p className={`text-2xl font-black ${card.value}`}>{valor}</p>
                    <p className={`text-xs font-bold ${card.label}`}>/{max} - {label}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-1 text-sm font-bold text-slate-700">Materias evaluadas en este contexto</h3>
              <p className="mb-3 text-xs text-slate-400">
                Las siguientes asignaturas aportan información al resumen mostrado arriba.
              </p>
              <div className="flex flex-wrap gap-2">
                {materias.map((materia) => (
                  <span
                    key={materia.id}
                    className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
                  >
                    {materia.code} - {materia.name}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.18)]">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
                  Análisis Gráfico
                </div>
                <h2 className="mt-3 text-xl font-black text-slate-800">
                  Desglose visual por sección y reactivo
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Aquí se muestra el comportamiento detallado de las respuestas estudiantiles para
                  sustentar el reporte del docente.
                </p>
              </div>
            </div>

            <GraficasDetalle
              facilitador={facilitador}
              habilidades={habilidades}
              medios={medios}
              autoevaluacion={autoevaluacion}
              teoriaPractica={teoriaPractica}
              showSectionSummary={false}
              promedios={{
                fac: promedioFac,
                hab: promedioHab,
                med: promedioMed,
                auto: promedioAuto,
              }}
            />
          </section>
        </>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <Inbox className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="font-bold text-slate-600">Sin gráficas disponibles aún</p>
          <p className="mt-1 text-sm text-slate-400">
            Cuando los alumnos evalúen materias de {selectedCareer.code}, aquí verás el detalle estadístico.
          </p>
        </div>
      )}
    </div>
  );
}
