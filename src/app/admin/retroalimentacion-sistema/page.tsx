import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  PLATFORM_FEEDBACK_QUESTIONS,
  buildPlatformFeedbackEligibility,
  buildPlatformFeedbackQuestionSummaries,
  getPercent,
  getPlatformFeedbackScoreLabel,
  getUniqueAssignedSubjectIds,
} from "@/lib/platformFeedback";
import { formatMexicoDateTime } from "@/lib/timeZone";

export const dynamic = "force-dynamic";

const TONE_STYLES: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
};

type SearchState = {
  periodId?: string;
};

export default async function RetroalimentacionSistemaPage({
  searchParams,
}: {
  searchParams: Promise<SearchState>;
}) {
  const { periodId: requestedPeriodId } = await searchParams;

  const periods = await prisma.period.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });

  const activePeriod = periods.find((period) => period.isActive) ?? null;
  const selectedPeriod =
    periods.find((period) => period.id === requestedPeriodId) ??
    activePeriod ??
    periods[0] ??
    null;

  const [responses, students] = selectedPeriod
    ? await Promise.all([
        prisma.platformFeedbackResponse.findMany({
          where: { periodId: selectedPeriod.id },
          orderBy: { createdAt: "desc" },
          select: {
            q1: true,
            q2: true,
            q3: true,
            q4: true,
            q5: true,
            createdAt: true,
          },
        }),
        prisma.student.findMany({
          where: { isActive: true },
          select: {
            id: true,
            groups: {
              select: {
                group: {
                  select: {
                    subjects: {
                      select: {
                        subjectId: true,
                      },
                    },
                  },
                },
              },
            },
            evaluations: {
              where: { periodId: selectedPeriod.id },
              select: {
                subjectId: true,
              },
            },
          },
        }),
      ])
    : [[], []];

  const eligibleStudentsCount = students.filter((student) =>
    buildPlatformFeedbackEligibility({
      assignedSubjectIds: getUniqueAssignedSubjectIds(student.groups),
      evaluatedSubjectIds: student.evaluations.map((evaluation) => evaluation.subjectId),
      hasResponse: false,
    }).hasCompletedAllEvaluations,
  ).length;

  const totalResponses = responses.length;
  const totalAnswerCount = totalResponses * PLATFORM_FEEDBACK_QUESTIONS.length;
  const totalScore = responses.reduce(
    (sum, response) => sum + response.q1 + response.q2 + response.q3 + response.q4 + response.q5,
    0,
  );
  const totalBuenoAnswers = responses.reduce(
    (sum, response) =>
      sum +
      [response.q1, response.q2, response.q3, response.q4, response.q5].filter((value) => value === 3).length,
    0,
  );

  const averageScore =
    totalAnswerCount > 0 ? Number((totalScore / totalAnswerCount).toFixed(2)) : 0;
  const coveragePercent = getPercent(totalResponses, eligibleStudentsCount);
  const buenoPercent = getPercent(totalBuenoAnswers, totalAnswerCount);
  const averageLabel = getPlatformFeedbackScoreLabel(averageScore);
  const questionSummaries = buildPlatformFeedbackQuestionSummaries(responses);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
        <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-12 h-24 w-24 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
              Desempeno del sistema
            </div>
            <h1 className="mt-4 text-3xl font-black text-slate-800">
              Cuestionario de <span className="text-blue-600">Satisfaccion del Sistema</span>
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
              Este modulo concentra la percepcion del alumno sobre la utilidad del sistema para
              evaluar a sus docentes. Sus resultados son independientes del FDA-24.5 y permiten
              medir el desempeno general de la plataforma.
            </p>
          </div>

          <form className="rounded-3xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
            <label htmlFor="periodId" className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Periodo
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <select
                id="periodId"
                name="periodId"
                defaultValue={selectedPeriod?.id ?? ""}
                className="min-w-[260px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                    {period.isActive ? " - Activo" : ""}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition-all hover:bg-blue-700"
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      </section>

      {!selectedPeriod ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <p className="font-black text-amber-800">No hay periodos registrados</p>
          <p className="mt-2 text-sm text-amber-700">
            Crea o activa un periodo para habilitar la encuesta final del sistema.
          </p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <ClipboardList className="h-4 w-4 text-blue-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Respuestas</span>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-800">{totalResponses}</p>
              <p className="mt-1 text-sm text-slate-500">Encuestas registradas en el periodo.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="h-4 w-4 text-indigo-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Cobertura</span>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-800">{coveragePercent}%</p>
              <p className="mt-1 text-sm text-slate-500">
                {totalResponses} de {eligibleStudentsCount} alumnos elegibles.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Promedio general</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-3xl font-black text-slate-800">{averageScore.toFixed(2)}</p>
                <span className="text-sm font-bold text-slate-400">/ 3</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Lectura global del cuestionario.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Respuestas Bueno</span>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-800">{buenoPercent}%</p>
              <p className="mt-1 text-sm text-slate-500">Porcentaje total de valoraciones positivas.</p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Lectura ejecutiva
                  </p>
                  <h2 className="mt-2 text-xl font-black text-slate-800">
                    Resultado general del cuestionario
                  </h2>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-black ${TONE_STYLES[averageLabel.tone]}`}
                >
                  {averageLabel.label}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                    Escala
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    Bueno = 3, Regular = 2, Malo = 1
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                    Respuesta mas reciente
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {responses[0]?.createdAt
                      ? formatMexicoDateTime(responses[0].createdAt)
                      : "Sin registros"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                    Periodo analizado
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{selectedPeriod.name}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Interpretacion</span>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
                <p>
                  Este tablero no altera los reportes institucionales. Su objetivo es concentrar la
                  percepcion del alumno sobre la usabilidad y el desempeno del sistema.
                </p>
                <p>
                  La cobertura se calcula sobre alumnos que ya terminaron todas sus evaluaciones del
                  periodo y, por lo tanto, eran elegibles para responder la encuesta final.
                </p>
              </div>
            </div>
          </section>

          {totalResponses === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-black text-slate-700">Aun no hay respuestas registradas</p>
              <p className="mt-2 text-sm text-slate-500">
                Cuando los alumnos completen sus evaluaciones docentes y respondan la encuesta final,
                aqui veras los resultados consolidados para evaluar el desempeno del sistema.
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {questionSummaries.map((summary, index) => (
                <article
                  key={summary.key}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                        {index + 1}
                      </span>
                      <h3 className="mt-3 text-lg font-black text-slate-800">{summary.label}</h3>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                        Promedio
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-800">
                        {summary.average.toFixed(2)} / 3
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {[
                      {
                        label: "Bueno",
                        count: summary.bueno,
                        percent: summary.buenoPercent,
                        bar: "bg-emerald-500",
                        text: "text-emerald-700",
                      },
                      {
                        label: "Regular",
                        count: summary.regular,
                        percent: summary.regularPercent,
                        bar: "bg-amber-400",
                        text: "text-amber-700",
                      },
                      {
                        label: "Malo",
                        count: summary.malo,
                        percent: summary.maloPercent,
                        bar: "bg-rose-500",
                        text: "text-rose-700",
                      },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-bold ${item.text}`}>{item.label}</span>
                          <span className="font-semibold text-slate-500">
                            {item.count} respuestas · {item.percent}%
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-100">
                          <div
                            className={`h-2.5 rounded-full ${item.bar}`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
