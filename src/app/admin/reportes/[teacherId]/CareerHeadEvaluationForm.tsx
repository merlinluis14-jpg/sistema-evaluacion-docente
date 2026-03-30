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
  periodId?: string;
  position: TeacherPosition;
  teacherName: string;
  periodName?: string;
  initialEvaluation: EvaluationValueMap | null;
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
  periodId,
  position,
  teacherName,
  periodName,
  initialEvaluation,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const rows = buildCareerHeadRows(initialEvaluation, position);
  const average = getCareerHeadAverage(initialEvaluation, position);

  if (!periodId) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
        <h3 className="text-sm font-black text-amber-800">Evaluación de coordinación pendiente de periodo</h3>
        <p className="text-sm text-amber-700 mt-2">
          Selecciona un periodo específico para capturar la evaluación institucional de {teacherName}.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-slate-800">Evaluación de Jefatura / Coordinación</h2>
          <p className="text-sm text-slate-500 mt-1">
            Formato institucional para {getTeacherPositionLabel(position)} · {periodName}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 min-w-40 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-500">Promedio Resp. PE</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{average.toFixed(2)}</p>
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
        <input type="hidden" name="periodId" value={periodId} />
        <input type="hidden" name="position" value={position} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="evaluatorName" className="text-sm font-bold text-slate-700">
              Evaluador(a)
            </label>
            <input
              id="evaluatorName"
              name="evaluatorName"
              defaultValue={initialEvaluation?.evaluatorName ?? ""}
              placeholder="Ej. Jefa de carrera"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
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
              placeholder="Observaciones generales de la coordinación"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-y"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">Factor</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">Definición</th>
                <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">Calif.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.key} className={!row.applies ? "bg-slate-50/70" : ""}>
                  <td className="px-4 py-3 align-top">
                    <p className="text-sm font-bold text-slate-700">{row.label}</p>
                    {!row.applies && (
                      <p className="text-xs font-medium text-slate-400 mt-1">No aplica para docentes PA</p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-500 leading-relaxed">{row.description}</td>
                  <td className="px-4 py-3 align-top text-center">
                    {row.applies ? (
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        name={row.key}
                        defaultValue={row.value ?? ""}
                        className="w-24 text-center px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                      />
                    ) : (
                      <span className="inline-flex min-w-24 items-center justify-center px-3 py-2 rounded-xl bg-slate-100 text-slate-500 text-sm font-bold">
                        N/A
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {scoreKeys.every((key) => (initialEvaluation?.[key] ?? null) === null) && !initialEvaluation?.comments && (
          <p className="text-xs text-slate-400">
            Captura esta evaluación para habilitar el cálculo combinado del formato institucional.
          </p>
        )}

        {statusMessage && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              statusMessage.includes("correctamente")
                ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                : "bg-red-50 border border-red-100 text-red-700"
            }`}
          >
            {statusMessage}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {pending ? "Guardando..." : "Guardar Evaluación de Jefatura"}
          </button>
        </div>
      </form>
    </div>
  );
}
