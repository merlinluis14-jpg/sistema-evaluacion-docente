"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { activatePeriod, deactivatePeriod, deletePeriod } from "./actions";
import { Trash2 } from "lucide-react";

type Period = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  _count: { evaluations: number };
};

type Variant = "row" | "card";

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Inactivo
    </span>
  );
}

function EvaluationCount({ count }: { count: number }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
        count > 0 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"
      }`}
    >
      {count}
    </span>
  );
}

export function PeriodControls({
  period,
  variant = "row",
}: {
  period: Period;
  variant?: Variant;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const formatDate = (value: Date) =>
    new Date(value).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const handleActivate = () => {
    startTransition(async () => {
      await activatePeriod(period.id);
      router.refresh();
    });
  };

  const handleDeactivate = () => {
    startTransition(async () => {
      await deactivatePeriod(period.id);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm(`Eliminar el período "${period.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deletePeriod(period.id);
        router.refresh();
      } catch {
        alert("No se puede eliminar: este período tiene evaluaciones registradas.");
      }
    });
  };

  const actionButtons = (
    <>
      {!period.isActive ? (
        <button
          onClick={handleActivate}
          disabled={isPending}
          className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-blue-800 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "..." : "Activar"}
        </button>
      ) : (
        <button
          onClick={handleDeactivate}
          disabled={isPending}
          className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "..." : "Desactivar"}
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={isPending || period._count.evaluations > 0}
        title={
          period._count.evaluations > 0
            ? "Tiene evaluaciones registradas, no se puede eliminar"
            : "Eliminar período"
        }
        className="rounded-lg px-2 py-2 text-xs font-bold text-red-500 transition-all hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );

  if (variant === "card") {
    return (
      <div
        className={`rounded-2xl border p-4 shadow-sm transition-colors ${
          period.isActive ? "border-emerald-100 bg-emerald-50/50" : "border-slate-100 bg-white"
        } ${isPending ? "opacity-60" : ""}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 h-12 w-2 flex-shrink-0 rounded-full ${
              period.isActive ? "bg-emerald-500" : "bg-slate-200"
            }`}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-base font-bold leading-tight text-slate-800">{period.name}</p>
                  <p className="mt-1 break-words text-xs font-mono text-slate-400">
                    {formatDate(period.startDate)} {"->"} {formatDate(period.endDate)}
                  </p>
                </div>
                <StatusBadge isActive={period.isActive} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <EvaluationCount count={period._count.evaluations} />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Evaluaciones
                    </p>
                    <p className="text-sm font-semibold text-slate-600">
                      {period._count.evaluations} registradas
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actionButtons}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr
      className={`group transition-colors hover:bg-slate-50 ${
        period.isActive ? "bg-emerald-50/50" : ""
      } ${isPending ? "opacity-60" : ""}`}
    >
      <td className="py-5 pl-6 pr-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-2 flex-shrink-0 rounded-full transition-colors ${
              period.isActive ? "bg-emerald-500" : "bg-slate-200"
            }`}
          />
          <div className="min-w-0">
            <p className="font-bold text-slate-800">{period.name}</p>
            <p className="mt-0.5 text-xs font-mono text-slate-400">
              {formatDate(period.startDate)} {"->"} {formatDate(period.endDate)}
            </p>
          </div>
        </div>
      </td>

      <td className="px-3 py-5">
        <StatusBadge isActive={period.isActive} />
      </td>

      <td className="px-3 py-5 text-center">
        <EvaluationCount count={period._count.evaluations} />
      </td>

      <td className="px-3 py-5 pr-6">
        <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity xl:opacity-0 xl:group-hover:opacity-100">
          {actionButtons}
        </div>
      </td>
    </tr>
  );
}
