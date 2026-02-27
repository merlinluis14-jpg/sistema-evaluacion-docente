import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PeriodControls } from "./PeriodControls";

export const dynamic = "force-dynamic";

export default async function PeriodosPage() {
    const periods = await prisma.period.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { evaluations: true } } }
    });

    const active = periods.find(p => p.isActive);
    const inactive = periods.filter(p => !p.isActive).length;

    return (
        <div className="p-8 pb-20 sm:p-12 max-w-5xl mx-auto animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        Periodos de Evaluación
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Gestiona los cuatrimestres activos para el instrumento FDA-24.5.
                    </p>
                </div>
                <Link
                    href="/dashboard/periodos/nuevo"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95"
                >
                    + Nuevo Periodo
                </Link>
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">📅</div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total</p>
                        <p className="text-3xl font-black text-slate-800">{periods.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">✅</div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Activo</p>
                        <p className="text-xl font-black text-emerald-700 truncate">{active?.name ?? "—"}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">⏸</div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Inactivos</p>
                        <p className="text-3xl font-black text-slate-800">{inactive}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                            <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider py-4 pl-6 pr-3">Periodo</th>
                            <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider py-4 px-3">Estado</th>
                            <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider py-4 px-3">Evaluaciones</th>
                            <th className="text-right text-xs font-black text-slate-400 uppercase tracking-wider py-4 px-3 pr-6">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {periods.map(p => <PeriodControls key={p.id} period={p} />)}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
