import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PeriodControls } from "./PeriodControls";
import { Calendar, CheckCircle2, PauseCircle, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PeriodosPage() {
  const periods = await prisma.period.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { evaluations: true } } },
  });

  const active = periods.find((period) => period.isActive);
  const inactive = periods.filter((period) => !period.isActive).length;

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in zoom-in duration-500 p-4 pb-20 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-slate-800 sm:text-3xl">
            Períodos de <span className="text-blue-600">Evaluación</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Gestiona los cuatrimestres activos para el instrumento FDA-24.5.
          </p>
        </div>

        <Link
          href="/admin/periodos/nuevo"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95 sm:w-auto"
        >
          <Plus size={16} />
          Nuevo Período
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100">
            <Calendar className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total</p>
            <p className="text-3xl font-black text-slate-800">{periods.length}</p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Activo</p>
            <p className="mt-1 text-base font-black leading-tight text-emerald-700 sm:text-lg">
              {active?.name ?? "Sin período activo"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <PauseCircle className="h-6 w-6 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Inactivos</p>
            <p className="text-3xl font-black text-slate-800">{inactive}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {periods.map((period) => (
          <PeriodControls key={`${period.id}-card`} period={period} variant="card" />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <th className="py-4 pl-6 pr-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                Período
              </th>
              <th className="px-3 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                Estado
              </th>
              <th className="px-3 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-400">
                Evaluaciones
              </th>
              <th className="px-3 py-4 pr-6 text-right text-xs font-black uppercase tracking-wider text-slate-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {periods.map((period) => (
              <PeriodControls key={`${period.id}-row`} period={period} variant="row" />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
