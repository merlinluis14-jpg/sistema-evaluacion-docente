import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MateriasPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
    const params = await searchParams;
    const success = params?.success;
    const error = params?.error;

    const materias = await prisma.subject.findMany({
        include: {
            teacher: true,
        },
        orderBy: {
            cuatrimestre: 'asc'
        }
    });

    return (
        <div className="p-8 pb-20 sm:p-12 animate-in fade-in zoom-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        Evaluación de Materias
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Selecciona una asignatura para evaluar el desempeño de tu docente.
                    </p>
                </div>
            </div>

            {success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <span className="text-xl">✅</span>
                    <p className="font-medium text-sm">Evaluación enviada exitosamente. ¡Gracias por tu participación!</p>
                </div>
            )}

            {error === "duplicada" && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <p className="font-medium text-sm">Ya has evaluado esta materia en el periodo actual. Solo se permite una evaluación por materia.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materias.map((materia) => (
                    <div key={materia.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                                    Cuatrimestre {materia.cuatrimestre}
                                </span>
                                <span className="text-xs font-mono text-gray-400">{materia.code}</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                                {materia.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-4 p-3 bg-gray-50 rounded-2xl">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs ring-2 ring-white">
                                    {materia.teacher.name[0]}{materia.teacher.lastName[0]}
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Docente</p>
                                    <p className="text-sm font-bold text-gray-700">{materia.teacher.name} {materia.teacher.lastName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Link
                                href={`/admin/materias/evaluar/${materia.id}`}
                                className="block w-full text-center py-3 px-4 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-blue-600 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gray-200"
                            >
                                Evaluar Docente
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {materias.length === 0 && (
                <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-20 text-center">
                    <p className="text-gray-500 font-medium">No hay materias disponibles para evaluar en este momento.</p>
                </div>
            )}
        </div>
    );
}

