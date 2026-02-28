// src/app/docente/page.tsx
// Vista principal del docente: sus resultados de evaluación FDA-24.5

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DocentePage() {
    const session = await getServerSession(authOptions);

    // Buscar al docente por su email de sesión
    let teacher = null;
    if (session?.user?.email) {
        teacher = await prisma.teacher.findFirst({
            where: { user: { email: session.user.email } },
            include: {
                career: true,
                evaluations: {
                    include: { subject: true, period: true },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });
    }

    // Calcular promedios si hay evaluaciones
    const evals = teacher?.evaluations ?? [];
    const totalEvals = evals.length;

    const avg = (items: number[]) =>
        items.length > 0 ? (items.reduce((a, b) => a + b, 0) / items.length).toFixed(2) : "—";

    const facAvg = avg(evals.map(e =>
        (e.fac_item01 + e.fac_item02 + e.fac_item03 + e.fac_item04 + e.fac_item05 +
            e.fac_item06 + e.fac_item07 + e.fac_item08 + e.fac_item09 + e.fac_item10 + e.fac_item11) / 11
    ));
    const habAvg = avg(evals.map(e =>
        (e.hab_item01 + e.hab_item02 + e.hab_item03 + e.hab_item04) / 4
    ));
    const medAvg = avg(evals.map(e =>
        (e.med_item01 + e.med_item02 + e.med_item03 + e.med_item04 + e.med_item05 + e.med_item06) / 6
    ));

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Encabezado */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    Mis <span className="text-indigo-600">Resultados</span>
                </h1>
                {teacher ? (
                    <p className="text-slate-500 mt-1">
                        {teacher.name} {teacher.lastName} · {teacher.career.name}
                    </p>
                ) : (
                    <p className="text-slate-400 mt-1 text-sm italic">
                        No se encontró perfil de docente para esta sesión.
                    </p>
                )}
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Evaluaciones recibidas", value: totalEvals.toString(), color: "bg-indigo-50 text-indigo-700", icon: "📋" },
                    { label: "Promedio Facilitador", value: facAvg, color: "bg-blue-50 text-blue-700", icon: "🎯" },
                    { label: "Promedio Habilidades", value: habAvg, color: "bg-emerald-50 text-emerald-700", icon: "💡" },
                    { label: "Promedio Medios Did.", value: medAvg, color: "bg-amber-50 text-amber-700", icon: "🖥️" },
                ].map(({ label, value, color, icon }) => (
                    <div key={label} className={`rounded-2xl p-5 border border-opacity-30 ${color} border-current`}>
                        <div className="text-2xl mb-2">{icon}</div>
                        <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
                        <p className="text-3xl font-black mt-1">{value}</p>
                    </div>
                ))}
            </div>

            {/* Tabla de evaluaciones recientes */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800">Evaluaciones Recientes</h2>
                    <span className="text-xs text-slate-400 font-medium">Últimas 10</span>
                </div>

                {evals.length === 0 ? (
                    <div className="p-16 text-center">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-slate-400 font-medium">Aún no tienes evaluaciones registradas.</p>
                        <p className="text-slate-300 text-sm mt-1">Los alumnos podrán evaluarte cuando el periodo esté activo.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/70 text-left text-xs font-black text-slate-400 uppercase tracking-wider">
                                    <th className="py-3 pl-6 pr-3">Materia</th>
                                    <th className="py-3 px-3">Periodo</th>
                                    <th className="py-3 px-3 text-center">Fac.</th>
                                    <th className="py-3 px-3 text-center">Hab.</th>
                                    <th className="py-3 px-3 text-center">Med.</th>
                                    <th className="py-3 pl-3 pr-6">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {evals.map((e) => {
                                    const facScore = ((e.fac_item01 + e.fac_item02 + e.fac_item03 + e.fac_item04 + e.fac_item05 +
                                        e.fac_item06 + e.fac_item07 + e.fac_item08 + e.fac_item09 + e.fac_item10 + e.fac_item11) / 11).toFixed(1);
                                    const habScore = ((e.hab_item01 + e.hab_item02 + e.hab_item03 + e.hab_item04) / 4).toFixed(1);
                                    const medScore = ((e.med_item01 + e.med_item02 + e.med_item03 + e.med_item04 + e.med_item05 + e.med_item06) / 6).toFixed(1);

                                    return (
                                        <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 pl-6 pr-3 text-sm font-semibold text-slate-800">{e.subject.name}</td>
                                            <td className="py-3 px-3 text-xs text-slate-500">{e.period.name}</td>
                                            <td className="py-3 px-3 text-center">
                                                <span className="font-black text-indigo-600">{facScore}</span>
                                                <span className="text-xs text-slate-400">/4</span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className="font-black text-blue-600">{habScore}</span>
                                                <span className="text-xs text-slate-400">/4</span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className="font-black text-emerald-600">{medScore}</span>
                                                <span className="text-xs text-slate-400">/5</span>
                                            </td>
                                            <td className="py-3 pl-3 pr-6 text-xs text-slate-400">
                                                {new Date(e.createdAt).toLocaleDateString("es-MX")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
