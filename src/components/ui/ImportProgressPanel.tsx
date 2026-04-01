"use client";

import type { ImportProgressState } from "@/lib/import/progress";

type ImportProgressPanelProps = {
  progress: ImportProgressState;
  label: string;
};

export default function ImportProgressPanel({
  progress,
  label,
}: ImportProgressPanelProps) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-blue-900">{label}</p>
          <p className="text-xs text-blue-700">
            {progress.processed} de {progress.total} filas procesadas
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-blue-700">{progress.percentage}%</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-blue-500">
            Progreso
          </p>
        </div>
      </div>

      <div
        aria-label="Progreso de importacion"
        aria-valuemax={progress.total || 1}
        aria-valuemin={0}
        aria-valuenow={progress.processed}
        className="h-3 overflow-hidden rounded-full bg-white"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-300 ease-out"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white px-3 py-2">
          <p className="text-lg font-black text-slate-700">{progress.total}</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Total
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-2">
          <p className="text-lg font-black text-emerald-600">{progress.success}</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-500">
            Importados
          </p>
        </div>
        <div className="rounded-xl bg-rose-50 px-3 py-2">
          <p className="text-lg font-black text-rose-600">{progress.errors}</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-rose-500">
            Errores
          </p>
        </div>
      </div>
    </div>
  );
}
