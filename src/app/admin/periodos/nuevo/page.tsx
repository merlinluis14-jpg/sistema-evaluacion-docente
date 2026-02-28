import { createPeriod } from "../actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NuevoPeriodoPage() {
    // Pre-cálculo de fechas para un cuatrimestre típico desde hoy
    const today = new Date();
    const yyyy = today.getFullYear();
    const start = `${yyyy}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const end = `${yyyy}-${String(today.getMonth() + 4).padStart(2, "0")}-30`;

    return (
        <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
            <div className="w-full max-w-xl space-y-6 animate-in fade-in slide-in-from-bottom duration-500">

                {/* Header */}
                <div>
                    <Link href="/admin/periodos"
                        className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors flex items-center gap-1 mb-4">
                        ← Volver a periodos
                    </Link>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Nuevo Periodo</h1>
                    <p className="text-slate-500 mt-1">
                        Crea un nuevo cuatrimestre de evaluación para el instrumento FDA-24.5.
                    </p>
                </div>

                {/* Formulario */}
                <form action={createPeriod} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">

                    {/* Nombre */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-bold text-slate-700">
                            Nombre del periodo <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            required
                            maxLength={80}
                            defaultValue={`Cuatrimestre ${today.getMonth() < 4 ? "Enero-Abril" :
                                today.getMonth() < 8 ? "Mayo-Agosto" : "Septiembre-Diciembre"
                                } ${yyyy}`}
                            placeholder="Ej: Cuatrimestre Enero-Abril 2026"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-slate-800 font-medium"
                        />
                        <p className="text-xs text-slate-400">Usa un nombre descriptivo que identifique el cuatrimestre institucional.</p>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="startDate" className="block text-sm font-bold text-slate-700">
                                Fecha de inicio <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="startDate"
                                type="date"
                                name="startDate"
                                required
                                defaultValue={start}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="endDate" className="block text-sm font-bold text-slate-700">
                                Fecha de fin <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="endDate"
                                type="date"
                                name="endDate"
                                required
                                defaultValue={end}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-slate-800"
                            />
                        </div>
                    </div>

                    {/* Nota */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5 text-sm">ℹ️</span>
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                            El periodo se creará como <strong>Inactivo</strong>.
                            Deberás activarlo manualmente desde la lista para que los alumnos puedan comenzar a evaluar.
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-2">
                        <Link href="/admin/periodos"
                            className="flex-1 text-center py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all text-sm">
                            Cancelar
                        </Link>
                        <button type="submit"
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 text-sm">
                            Crear Periodo
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

