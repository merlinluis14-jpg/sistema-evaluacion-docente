// Gestión de Materias - Panel Administrador

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, BookOpen, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MateriasAdminPage({
    searchParams,
}: {
    searchParams: Promise<{ carrera?: string; q?: string }>;
}) {
    const { carrera, q } = await searchParams;

    const carreras = await prisma.career.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
    });

    const materias = await prisma.subject.findMany({
        where: {
            ...(carrera ? { careerId: carrera } : {}),
            ...(q
                ? {
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { code: { contains: q, mode: "insensitive" } },
                    ],
                }
                : {}),
        },
        include: {
            teacher: true,
            career: true,
        },
        orderBy: [{ career: { code: "asc" } }, { cuatrimestre: "asc" }],
    });

    const totalMaterias = await prisma.subject.count();

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">

            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">
                        Gestión de <span className="text-blue-600">Materias</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {totalMaterias} materias registradas en el sistema
                    </p>
                </div>
                <Link
                    href="/admin/materias/nueva"
                    className="flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 active:scale-95 transition-all shadow-lg shadow-blue-700/20"
                >
                    <Plus size={16} /> Nueva Materia
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <form className="flex gap-3 flex-wrap items-end">
                    <div className="flex-1 min-w-48">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                            Buscar
                        </label>
                        <input
                            name="q"
                            defaultValue={q}
                            placeholder="Nombre o código de materia..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                            Carrera
                        </label>
                        <select
                            name="carrera"
                            defaultValue={carrera}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        >
                            <option value="">Todas las carreras</option>
                            {carreras.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.code} — {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 active:scale-95 transition-all"
                    >
                        Filtrar
                    </button>

                    {(q || carrera) && (
                        <Link
                            href="/admin/materias"
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                        >
                            Limpiar
                        </Link>
                    )}
                </form>
            </div>

            {/* Tabla de materias */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-700">
                        Mostrando {materias.length} de {totalMaterias} materias
                    </h2>
                </div>

                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Código
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Materia
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Carrera
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Cuatrimestre
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Docente asignado
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {materias.map((materia) => (
                            <tr
                                key={materia.id}
                                className="hover:bg-slate-50/50 transition-colors"
                            >
                                <td className="px-6 py-3">
                                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                        {materia.code}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <p className="font-semibold text-slate-800 text-sm">
                                        {materia.name}
                                    </p>
                                </td>

                                <td className="px-4 py-3 text-center">
                                    <span className="bg-indigo-50 text-indigo-700 font-black text-xs px-2 py-1 rounded-lg">
                                        {materia.career.code}
                                    </span>
                                </td>

                                <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-bold text-slate-600">
                                        {materia.cuatrimestre}°
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                                            {materia.teacher.name[0]}
                                            {materia.teacher.lastName[0]}
                                        </div>
                                        <span className="text-sm text-slate-600">
                                            {materia.teacher.name} {materia.teacher.lastName}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-4 py-3 text-center">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-bold border ${materia.isActive
                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : "bg-slate-100 text-slate-500 border-slate-200"
                                            }`}
                                    >
                                        {materia.isActive ? "Activa" : "Inactiva"}
                                    </span>
                                </td>

                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={`/admin/materias/${materia.id}/editar`}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                    >
                                        <Pencil size={14} /> Editar
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {materias.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                        <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
                        <p className="font-bold text-slate-600">No se encontraron materias</p>
                        <p className="text-sm mt-1">
                            {q || carrera
                                ? "Intenta con otros filtros"
                                : "Crea la primera materia con el botón superior"}
                        </p>
                        <Link
                            href="/admin/materias/nueva"
                            className="inline-flex items-center justify-center gap-2 mt-4 bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-all shadow-md shadow-blue-700/20 hover:scale-105 active:scale-95"
                        >
                            <Plus size={16} /> Nueva Materia
                        </Link>
                    </div>
                )}
            </div>

        </div>
    );
}
