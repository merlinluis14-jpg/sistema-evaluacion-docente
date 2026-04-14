import Link from "next/link";
import { Calendar, CloudDownload, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatAcademicText } from "@/lib/text/academicText";
import { CareerFilter } from "./CareerFilter";

export const dynamic = "force-dynamic";

export default async function GruposPage({
    searchParams,
}: {
    searchParams: Promise<{ careerId?: string }>;
}) {
    const { careerId } = await searchParams;

    const [groups, careers] = await Promise.all([
        prisma.group.findMany({
            where: careerId ? { careerId } : {},
            orderBy: [{ career: { code: "asc" } }, { name: "asc" }],
            include: {
                career: true,
                _count: { select: { enrollments: true } },
            },
        }),
        prisma.career.findMany({ orderBy: { code: "asc" } }),
    ]);

    return (
        <div className="mx-auto max-w-7xl animate-in fade-in zoom-in p-8 pb-20 duration-500 sm:p-12">
            <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">
                        Catálogo de <span className="text-blue-600">Grupos</span>
                    </h1>
                    <p className="mt-2 text-lg text-slate-500">
                        Consulta los grupos sincronizados desde Horarios y su carga actual de alumnos.
                    </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
                    <Link
                        href="/admin/docentes/sincronizar"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95 sm:w-auto"
                    >
                        <CloudDownload size={16} />
                        Sincronizar academia
                    </Link>
                    <CareerFilter careers={careers} />
                </div>
            </div>

            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800 shadow-sm">
                Los grupos ya no se capturan manualmente aquí. Cada grupo debe existir primero en
                Horarios y después sincronizarse para que pueda usarse con alumnos y evaluaciones.
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="py-5 pl-8 pr-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                                    Grupo
                                </th>
                                <th className="px-4 py-5 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                                    Carrera
                                </th>
                                <th className="px-4 py-5 text-left text-xs font-bold uppercase tracking-widest text-slate-400">
                                    Período
                                </th>
                                <th className="px-4 py-5 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                                    Alumnos
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {groups.map((group) => (
                                <tr key={group.id} className="group transition-colors hover:bg-blue-50/30">
                                    <td className="py-5 pl-8 pr-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white font-black text-blue-600 shadow-sm transition-transform group-hover:scale-110">
                                                {group.name}
                                            </div>
                                            <span className="text-lg font-bold text-slate-800">{group.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{group.career.code}</span>
                                            <span className="max-w-[200px] truncate text-xs font-medium text-slate-400">
                                                {formatAcademicText(group.career.name)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                                            <Calendar className="h-3 w-3" />
                                            {group.period}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-lg font-black text-slate-800">
                                                {group._count.enrollments}
                                            </span>
                                            <span className="text-xs font-bold uppercase text-slate-400">
                                                Estudiantes
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {groups.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <Users className="mx-auto mb-4 h-10 w-10 text-slate-200" />
                                        <p className="font-bold text-slate-400">
                                            No se encontraron grupos con los criterios seleccionados.
                                        </p>
                                        {careerId ? (
                                            <Link
                                                href="/admin/grupos"
                                                className="mt-2 inline-block text-sm font-bold text-slate-500 transition-colors hover:text-slate-700 hover:underline"
                                            >
                                                Limpiar filtros
                                            </Link>
                                        ) : (
                                            <Link
                                                href="/admin/docentes/sincronizar"
                                                className="mt-2 inline-block text-sm font-bold text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                                            >
                                                Revisar sincronización académica
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
