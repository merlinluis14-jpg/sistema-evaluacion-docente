import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import GraficasDetalle from "./GraficasDetalle";
import ExportTeacherPdf from "./ExportTeacherPdf";
import CareerHeadEvaluationForm from "./CareerHeadEvaluationForm";
import { buildStudentReport, getPerformanceLevel, getTeacherPositionLabel } from "@/lib/reportes";
import { Target, Lightbulb, Monitor, ClipboardCheck, Inbox, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const COLOR_CARD: Record<string, { bg: string; border: string; icon: string; value: string; label: string }> = {
  blue: { bg: "bg-[#1B2A6B]/5", border: "border-[#1B2A6B]/10", icon: "text-[#1B2A6B]", value: "text-[#1B2A6B]", label: "text-[#7A7468]" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-100", icon: "text-indigo-500", value: "text-indigo-700", label: "text-indigo-400" },
  violet: { bg: "bg-violet-50", border: "border-violet-100", icon: "text-violet-500", value: "text-violet-700", label: "text-violet-400" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-500", value: "text-emerald-700", label: "text-emerald-400" },
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

  const availableCareers = Array.from(availableCareersMap.values()).sort((a, b) => {
    if (a.id === teacher.career.id) return -1;
    if (b.id === teacher.career.id) return 1;
    return a.code.localeCompare(b.code, "es");
  });

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
    const matchingGroups = evaluation.student.groups.filter((enrollment) =>
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
    promedios: {
      fac: promedioFac,
      hab: promedioHab,
      med: promedioMed,
      auto: promedioAuto,
      global: promedioGlobal,
    },
  } = studentReport;
  const nivel = getPerformanceLevel(promedioGlobal);

  const materias = [...new Map(evaluaciones.map((evaluation) => [evaluation.subjectId, evaluation.subject])).values()];

  const baseQuery = periodoId ? `periodoId=${periodoId}` : "";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href={`/admin/reportes${periodoId ? `?periodoId=${periodoId}` : ""}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
        >
          <ArrowLeft size={15} /> Volver a Reportes
        </Link>

        {n > 0 && (
          <ExportTeacherPdf
            teacher={{
              ...teacher,
              career: selectedCareer,
            }}
            periodo={periodo?.name ?? "Historico Total"}
            evaluacionesCount={n}
            promedios={{ fac: promedioFac, hab: promedioHab, med: promedioMed, auto: promedioAuto, global: promedioGlobal }}
            nivel={nivel}
            facilitador={facilitador}
            habilidades={habilidades}
            medios={medios}
            autoevaluacion={autoevaluacion}
          />
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#1B2A6B] to-[#2A3F9F] rounded-2xl flex items-center justify-center text-white text-xl font-black">
              {teacher.name[0]}{teacher.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">
                {teacher.name} {teacher.lastName}
              </h1>
              <p className="text-slate-400 text-sm">
                Contexto: {selectedCareer.code} - {selectedCareer.name}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {getTeacherPositionLabel(teacher.position)} · {teacher.employeeId}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {periodo?.name ?? "Sin periodo"} · {n} evaluacion{n !== 1 ? "es" : ""} de alumnos
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-4xl font-black text-[#1B2A6B]">{promedioGlobal.toFixed(2)}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Promedio Global</p>
            <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-bold ${
              nivel === "Excelente"
                ? "bg-emerald-100 text-emerald-700"
                : nivel === "Bueno"
                  ? "bg-blue-100 text-[#1B2A6B]"
                  : nivel === "Regular"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
            }`}>
              {nivel}
            </span>
          </div>
        </div>

        {availableCareers.length > 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {availableCareers.map((career) => {
              const href = `/admin/reportes/${teacher.id}?${[baseQuery, `careerId=${career.id}`].filter(Boolean).join("&")}`;
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
        )}
      </div>

      {n > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Facilitador", valor: promedioFac, max: 4, color: "blue", Icon: Target },
              { label: "Habilidades", valor: promedioHab, max: 5, color: "indigo", Icon: Lightbulb },
              { label: "Medios Did.", valor: promedioMed, max: 5, color: "violet", Icon: Monitor },
              { label: "Autoevaluac.", valor: promedioAuto, max: 5, color: "emerald", Icon: ClipboardCheck },
            ].map(({ label, valor, max, color, Icon }) => {
              const card = COLOR_CARD[color];
              return (
                <div key={label} className={`${card.bg} border ${card.border} rounded-2xl p-4 text-center`}>
                  <Icon className={`w-5 h-5 mb-1 mx-auto ${card.icon}`} />
                  <p className={`text-2xl font-black ${card.value}`}>{valor}</p>
                  <p className={`text-xs ${card.label} font-bold`}>/{max} · {label}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-700 mb-3 text-sm">Materias evaluadas en este contexto</h3>
            <div className="flex flex-wrap gap-2">
              {materias.map((materia) => (
                <span key={materia.id} className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl">
                  {materia.code} · {materia.name}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="font-bold text-amber-800">Aun no hay evaluaciones de alumnos en esta carrera para este periodo.</p>
          <p className="text-sm text-amber-700 mt-1">
            La coordinacion puede capturar su evaluacion institucional, pero el promedio combinado se vera completo
            cuando existan resultados de alumnos en este contexto.
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
        periodName={periodo?.name ?? "Sin periodo"}
        position={teacher.position}
        initialEvaluation={careerHeadEvaluation}
        assignmentOverview={assignmentOverview}
      />

      {n > 0 ? (
        <GraficasDetalle
          facilitador={facilitador}
          habilidades={habilidades}
          medios={medios}
          autoevaluacion={autoevaluacion}
          promedios={{
            fac: promedioFac,
            hab: promedioHab,
            med: promedioMed,
            auto: promedioAuto,
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <Inbox className="w-12 h-12 mb-3 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-600">Sin graficas disponibles aun</p>
          <p className="text-sm text-slate-400 mt-1">
            Cuando los alumnos evalen materias de {selectedCareer.code}, aqui veras el detalle estadistico.
          </p>
        </div>
      )}
    </div>
  );
}
