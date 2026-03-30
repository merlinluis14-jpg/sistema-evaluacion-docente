import Link from "next/link";
import { BarChart2, Calendar, ClipboardList, Inbox, UserCog } from "lucide-react";
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

  const [periodos, carreras] = await Promise.all([
    prisma.period.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.career.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
  ]);

  const officialCareer = carreras.find((career) => career.code === OFFICIAL_DEMO_CAREER_CODE) ?? null;
  const showAllCareers = isAllCareersValue(requestedCareerId);
  const carreraId = showAllCareers
    ? undefined
    : requestedCareerId || officialCareer?.id;
  const selectedCareerValue = showAllCareers ? ALL_CAREERS_VALUE : carreraId ?? "";

  const [materias, grupos] = await Promise.all([
    prisma.subject.findMany({
      where: {
        isActive: true,
        ...(carreraId ? { careerId: carreraId } : {}),
      },
      orderBy: { name: "asc" },
      include: { teacher: true },
    }),
    prisma.group.findMany({
      where: carreraId ? { careerId: carreraId } : undefined,
      orderBy: { name: "asc" },
      include: { career: true },
    }),
  ]);

  const periodoActivo = periodos.find((periodo) => periodo.isActive);
  const periodoId = periodoIdParam ?? periodoActivo?.id;

  const evaluaciones = await prisma.evaluation.findMany({
    where: {
      ...(periodoId ? { periodId: periodoId } : {}),
      ...(carreraId ? { teacher: { careerId: carreraId } } : {}),
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
      subject: true,
      period: true,
    },
  });

  const docenteMap = new Map<
    string,
    {
      teacher: (typeof evaluaciones)[number]["teacher"];
      evals: typeof evaluaciones;
    }
  >();

  for (const evaluation of evaluaciones) {
    const key = evaluation.teacherId;
    if (!docenteMap.has(key)) {
      docenteMap.set(key, { teacher: evaluation.teacher, evals: [] });
    }
    docenteMap.get(key)!.evals.push(evaluation);
  }

  const teacherIds = Array.from(docenteMap.keys());
  const careerHeadEvaluations = teacherIds.length > 0 && periodoId
    ? await prisma.careerHeadEvaluation.findMany({
        where: {
          periodId: periodoId,
          teacherId: { in: teacherIds },
        },
      })
    : [];

  const careerHeadMap = new Map(
    careerHeadEvaluations.map((evaluation) => [evaluation.teacherId, evaluation]),
  );

  const reporteDocentesBase = Array.from(docenteMap.values()).map(({ teacher, evals }) => {
    const { promedios } = buildStudentReport(evals);
    const careerHeadEvaluation = careerHeadMap.get(teacher.id) ?? null;
    const careerHeadAvg = getCareerHeadAverage(careerHeadEvaluation, teacher.position);
    const institutionalScore = buildInstitutionalFinalScore(careerHeadAvg, promedios.global);
    const referenceScore = getReferenceScore(promedios.global, careerHeadAvg);
    const nivel = getPerformanceLevel(promedios.global);
    const nivelColor = getPerformanceLevelColor(promedios.global);

    return {
      teacher,
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
      materias: [...new Set(evals.map((evaluation) => evaluation.subject.name))],
    };
  });

  const scoreFilter = Number(calificacion || "");
  const sortOrder = orden === "asc" ? "asc" : "desc";

  const reporteDocentes = reporteDocentesBase
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
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Reportes de <span className="text-blue-600">Evaluacion</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Instrumento FDA-24.5 · {periodoNombre}
            {materiaNombre ? ` · ${materiaNombre}` : ""}
            {grupoNombre ? ` · Grupo ${grupoNombre.name} (${grupoNombre.career.code})` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Link
            href="/admin/reportes/importar-jefatura"
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
          >
            Importar Eval. Jefatura
          </Link>
          <ExportButtons
            data={reporteDocentes}
            periodo={periodoNombre}
            canExportInstitutional={Boolean(periodoId)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <form className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Periodo</label>
            <select
              name="periodoId"
              defaultValue={periodoId}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Todos los periodos</option>
              {periodos.map((periodo) => (
                <option key={periodo.id} value={periodo.id}>
                  {periodo.name} {periodo.isActive ? "• Activo" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Carrera</label>
            <select
              name="carreraId"
              defaultValue={selectedCareerValue}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
          >
              {officialCareer && (
                <option value={officialCareer.id}>
                  {officialCareer.code} - {officialCareer.name}
                </option>
              )}
              <option value={ALL_CAREERS_VALUE}>Todas las carreras</option>
              {carreras
                .filter((career) => career.id !== officialCareer?.id)
                .map((career) => (
                  <option key={career.id} value={career.id}>
                    {career.code} - {career.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Materia</label>
            <select
              name="materiaId"
              defaultValue={materiaId}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Todas las materias</option>
              {materias.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Grupo</label>
            <select
              name="grupoId"
              defaultValue={grupoId}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Todos los grupos</option>
              {grupos.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} - {group.career.code} · {group.period}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Calif. /5</label>
            <select
              name="calificacion"
              defaultValue={calificacion ?? ""}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Todas</option>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Orden</label>
            <select
              name="orden"
              defaultValue={sortOrder}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="desc">Mayor a menor</option>
              <option value="asc">Menor a mayor</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-all"
          >
            Filtrar
          </button>

          {hasFilters && (
            <Link
              href="/admin/reportes"
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            >
              Limpiar
            </Link>
          )}
        </form>
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
            {periodoActivo ? "Si" : "No"}
          </p>
          <p className={`text-xs font-bold mt-0.5 ${periodoActivo ? "text-blue-600" : "text-slate-500"}`}>
            Periodo activo
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-700">Resultados por Docente</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ordenados por calificacion de referencia /5. Si existe evaluacion de jefatura, se promedia con la evaluacion de alumnos.
          </p>
        </div>

        {reporteDocentes.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className="w-12 h-12 mb-3 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-500">No hay evaluaciones para este filtro</p>
            <p className="text-sm text-slate-400 mt-1">Selecciona un periodo con evaluaciones registradas</p>
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
                  <tr key={docente.teacher.id} className="hover:bg-slate-50/50 transition-colors">
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
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="bg-indigo-50 text-indigo-700 font-black text-xs px-2 py-1 rounded-lg">
                        {docente.teacher.career.code}
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
                        href={`/admin/reportes/${docente.teacher.id}${periodoId ? `?periodoId=${periodoId}` : ""}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        Ver detalle →
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
