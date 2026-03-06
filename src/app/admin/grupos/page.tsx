// src/app/admin/grupos/page.tsx
import { prisma } from "@/lib/prisma";
import { CareerFilter } from "./CareerFilter";
import Link from "next/link";

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
        <div className="p-8 pb-20 sm:p-12 animate-in fade-in zoom-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">
                        Gestión de <span className="text-blue-600">Grupos</span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Control de grupos académicos y matriculación por carrera.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <CareerFilter careers={careers} />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-widest py-5 pl-8 pr-4">Grupo</th>
                                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-widest py-5 px-4">Carrera</th>
                                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-widest py-5 px-4">Periodo</th>
                                <th className="text-center text-xs font-black text-slate-400 uppercase tracking-widest py-5 px-4">Alumnos</th>
                                <th className="text-right text-xs font-black text-slate-400 uppercase tracking-widest py-5 pl-4 pr-8">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {groups.map((group) => (
                                <tr key={group.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="py-5 pl-8 pr-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center font-black text-blue-600 group-hover:scale-110 transition-transform">
                                                {group.name}
                                            </div>
                                            <span className="font-bold text-slate-800 text-lg">{group.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 text-sm">{group.career.code}</span>
                                            <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{group.career.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                                            📅 {group.period}
                                        </span>
                                    </td>
                                    <td className="py-5 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-lg font-black text-slate-800">{group._count.enrollments}</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Estudiantes</span>
                                        </div>
                                    </td>
                                    <td className="py-5 pl-4 pr-8 text-right">
                                        <button className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {groups.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <p className="text-4xl mb-4 text-slate-200">👥</p>
                                        <p className="text-slate-400 font-bold">No se encontraron grupos con los criterios seleccionados.</p>
                                        {careerId && (
                                            <Link href="/admin/grupos" className="text-blue-600 text-sm font-bold mt-2 inline-block hover:underline">
                                                Limpiar filtros
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
