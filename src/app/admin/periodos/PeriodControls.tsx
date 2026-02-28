"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { activatePeriod, deactivatePeriod, deletePeriod } from "./actions";

type Period = {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    _count: { evaluations: number };
};

export function PeriodControls({ period }: { period: Period }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const fmt = (d: Date) =>
        new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

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
        if (!confirm(`¿Eliminar el periodo "${period.name}"? Esta acción no se puede deshacer.`)) return;
        startTransition(async () => {
            try {
                await deletePeriod(period.id);
                router.refresh();
            } catch {
                alert("No se puede eliminar: este periodo tiene evaluaciones registradas.");
            }
        });
    };

    return (
        <tr className={`hover:bg-slate-50 transition-colors group ${period.isActive ? "bg-emerald-50/50" : ""} ${isPending ? "opacity-60" : ""}`}>

            {/* Nombre y fechas */}
            <td className="py-5 pl-6 pr-3">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full flex-shrink-0 transition-colors ${period.isActive ? "bg-emerald-500" : "bg-slate-200"}`}></div>
                    <div>
                        <p className="font-bold text-slate-800">{period.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                            {fmt(period.startDate)} → {fmt(period.endDate)}
                        </p>
                    </div>
                </div>
            </td>

            {/* Estado */}
            <td className="px-3 py-5">
                {period.isActive ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Activo
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Inactivo
                    </span>
                )}
            </td>

            {/* Número de evaluaciones */}
            <td className="px-3 py-5 text-center">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${period._count.evaluations > 0 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"
                    }`}>
                    {period._count.evaluations}
                </span>
            </td>

            {/* Botones de acción (visibles al hacer hover) */}
            <td className="px-3 py-5 pr-6">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!period.isActive ? (
                        <button onClick={handleActivate} disabled={isPending}
                            className="text-xs font-bold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                            {isPending ? "..." : "✓ Activar"}
                        </button>
                    ) : (
                        <button onClick={handleDeactivate} disabled={isPending}
                            className="text-xs font-bold bg-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-300 transition-all active:scale-95 disabled:opacity-50">
                            {isPending ? "..." : "Desactivar"}
                        </button>
                    )}

                    <button
                        onClick={handleDelete}
                        disabled={isPending || period._count.evaluations > 0}
                        title={period._count.evaluations > 0 ? "Tiene evaluaciones registradas, no se puede eliminar" : "Eliminar periodo"}
                        className="text-xs font-bold text-red-400 hover:text-red-600 px-2 py-2 rounded-lg hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        🗑
                    </button>
                </div>
            </td>
        </tr>
    );
}

