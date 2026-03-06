// src/app/admin/carreras/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CarrerasPage() {
    const careers = await prisma.career.findMany({
        orderBy: { code: "asc" },
        include: {
            _count: {
                select: {
                    teachers: true,
                    students: true,
                    groups: true,
                }
            }
        }
    });

    return (
        <div className="p-8 pb-20 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">
                        Oferta <span className="text-blue-600">Académica</span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Listado oficial de carreras técnicas y licenciaturas de la UPTX.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {careers.map((career) => (
                    <div
                        key={career.id}
                        className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col"
                    >
                        <div className="p-1.5 flex-1">
                            <div className="bg-slate-50 rounded-[22px] p-6 h-full flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-2xl font-black text-blue-600 group-hover:scale-110 transition-transform duration-500">
                                        {career.code}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${career.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                                        }`}>
                                        {career.isActive ? "Activa" : "Inactiva"}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 leading-tight mb-6 group-hover:text-blue-700 transition-colors">
                                    {career.name}
                                </h3>

                                <div className="grid grid-cols-3 gap-2 mt-auto">
                                    <div className="bg-white/60 rounded-xl p-2.5 text-center border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Docs</p>
                                        <p className="text-lg font-black text-slate-700">{career._count.teachers}</p>
                                    </div>
                                    <div className="bg-white/60 rounded-xl p-2.5 text-center border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Alumn</p>
                                        <p className="text-lg font-black text-slate-700">{career._count.students}</p>
                                    </div>
                                    <div className="bg-white/60 rounded-xl p-2.5 text-center border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Grup</p>
                                        <p className="text-lg font-black text-slate-700">{career._count.groups}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-white flex items-center justify-between border-t border-slate-50">
                            <Link
                                href={`/admin/docentes?career=${career.id}`}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                Ver Docentes →
                            </Link>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-400 transition-all">
                                🏛️
                            </div>
                        </div>
                    </div>
                ))}

                {careers.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-4xl mb-4">🏜️</p>
                        <p className="text-slate-500 font-medium text-lg">No se han registrado carreras en el sistema.</p>
                        <p className="text-slate-400 text-sm mt-1">Ejecuta el seed o agrega una manualmente.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
