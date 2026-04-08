"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

import { saveCareerHeadEvaluation } from "../actions";
import {
  buildCareerHeadRows,
  getCareerHeadAverage,
  getTeacherPositionLabel,
  type CareerHeadFactorKey,
  type TeacherPosition,
} from "@/lib/reportes";

type EvaluationValueMap = Partial<Record<CareerHeadFactorKey, number | null>> & {
  evaluatorName?: string | null;
  comments?: string | null;
};

type Props = {
  teacherId: string;
  careerId: string;
  careerCode: string;
  careerName: string;
  periodId?: string;
  position: TeacherPosition;
  teacherName: string;
  periodName?: string;
  initialEvaluation: EvaluationValueMap | null;
  assignmentOverview: Array<{
    key: string;
    subjectCode: string;
    subjectName: string;
    groupName: string;
    evaluationsCount: number;
    studentAverage: string;
  }>;
};

const scoreKeys: CareerHeadFactorKey[] = [
  "planCourseScore",
  "competencyEvalScore",
  "researchScore",
  "tutoringScore",
  "advisoryScore",
  "platformUsageScore",
  "problemSolvingScore",
  "punctualityScore",
  "teamworkScore",
];

export default function CareerHeadEvaluationForm({
  teacherId,
  careerId,
  careerCode,
  careerName,
  periodId,
  position,
  teacherName,
  periodName,
  initialEvaluation,
  assignmentOverview,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const rows = buildCareerHeadRows(initialEvaluation, position);
  const average = getCareerHeadAverage(initialEvaluation, position);
  const groupsCount = new Set(assignmentOverview.map((item) => item.groupName)).size;

  if (!periodId) {
    return (
      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
        <h3 className="text-sm font-black text-amber-800">
          Evaluación de coordinación pendiente de período
        </h3>
        <p className="mt-2 text-sm text-amber-700">
          Selecciona un período específico para capturar la evaluación institucional de {teacherName}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.2)] backdrop-blur sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Formato Institucional
          </span>
          <h2 className="mt-3 text-lg font-black text-slate-800 sm:text-xl">
            Evaluación de Jefatura / Coordinación
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Formato institucional para {getTeacherPositionLabel(position)} - {periodName}
          </p>
        </div>

        <div className="min-w-40 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-500">Promedio Resp. PE</p>
          <p className="mt-1 text-2xl font-black text-blue-700">{average.toFixed(2)}</p>
        </div>
      </div>

      <form
        action={(formData) => {
          setStatusMessage(null);
          startTransition(async () => {
            try {
              await saveCareerHeadEvaluation(formData);
              setStatusMessage("Evaluación de coordinación guardada correctamente.");
              router.refresh();
            } catch (error) {
              setStatusMessage(
                error instanceof Error ? error.message : "No se pudo guardar la evaluación de coordinación.",
              );
            }
          });
        }}
        className="space-y-5"
      >
        <input type="hidden" name="teacherId" value={teacherId} />
        <input type="hidden" name="careerId" value={careerId} />
        <input type="hidden" name="periodId" value={periodId} />
        <input type="hidden" name="position" value={position} />

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Contexto de evaluación
              </p>
              <p className="mt-1 text-sm font-black text-slate-700">
                {careerCode} - {careerName}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                La coordinación se guardará para esta carrera dentro del período seleccionado.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-bold text-blue-700 shadow-sm">
                {assignmentOverview.length} asignaciones
              </span>
              <span className="inline-flex items-center rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-sm">
                {groupsCount} grupos
              </span>
            </div>
          </div>

          {assignmentOverview.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Asignaciones detectadas
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Materias y grupos considerados en esta captura institucional.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
                  {assignmentOverview.length} registros
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Materia
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Grupo
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                        Evals.
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                        Prom. alumnos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignmentOverview.map((item) => (
                      <tr key={item.key} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-slate-700">{item.subjectName}</p>
                          <p className="text-xs text-slate-400">{item.subjectCode}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-600">
                          {item.groupName}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-600">
                          {item.evaluationsCount}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-black text-indigo-600">
                          {item.studentAverage}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Aún no hay asignaciones detectadas en esta carrera para este período. La coordinación
              se puede capturar, pero conviene revisar primero las materias y grupos enlazados del docente.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/90 to-white p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Responsable de Captura
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="evaluatorName" className="text-sm font-bold text-slate-700">
                Evaluador(a)
              </label>
              <input
                id="evaluatorName"
                name="evaluatorName"
                defaultValue={initialEvaluation?.evaluatorName ?? ""}
                placeholder="Ej. Jefa de carrera"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="comments" className="text-sm font-bold text-slate-700">
                Comentarios
              </label>
              <textarea
                id="comments"
                name="comments"
                defaultValue={initialEvaluation?.comments ?? ""}
                placeholder="Observaciones generales de la coordinacion"
                rows={3}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-4 sm:px-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Factores de Evaluación
              </p>
              <h3 className="mt-1 text-base font-black text-slate-800">
                Captura institucional por factor
              </h3>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Registra calificaciones en escala de 0.0 a 5.0 para cada factor aplicable.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    Factor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    Definicion
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                    Calif.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className={`${!row.applies ? "bg-slate-50/80" : "bg-white"} transition-colors hover:bg-slate-50/70`}
                  >
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm font-bold text-slate-700">{row.label}</p>
                      {!row.applies && (
                        <p className="mt-1 text-xs font-medium text-slate-400">
                          No aplica para docentes PA
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-sm leading-relaxed text-slate-500">
                      {row.description}
                    </td>
                    <td className="px-4 py-3 text-center align-top">
                      {row.applies ? (
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          name={row.key}
                          defaultValue={row.value ?? ""}
                          className="w-24 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center font-bold text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      ) : (
                        <span className="inline-flex min-w-24 items-center justify-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-500">
                          N/A
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {scoreKeys.every((key) => (initialEvaluation?.[key] ?? null) === null) &&
          !initialEvaluation?.comments && (
            <p className="text-xs text-slate-400">
              Captura esta evaluación para habilitar el cálculo combinado del formato institucional.
            </p>
          )}

        {statusMessage && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              statusMessage.includes("correctamente")
                ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border border-red-100 bg-red-50 text-red-700"
            }`}
          >
            {statusMessage}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {pending ? "Guardando..." : "Guardar Evaluación de Jefatura"}
          </button>
        </div>
      </form>
    </div>
  );
}
