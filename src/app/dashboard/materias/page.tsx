import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MateriasPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
    const params = await searchParams;
    const success = params?.success;
    const error = params?.error;
    // Obtenemos las materias registradas, incluyendo los datos del docente relacionado
    const materias = await prisma.subject.findMany({
        include: {
            teacher: true, // Esto es magia relacional: trae el docente asociado
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <div className="p-8 pb-20 sm:p-12 animate-in fade-in zoom-in duration-500 max-w-7xl mx-auto">

            {/* Banner de éxito */}
            {success === "true" && (
                <div className="mb-6 flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-2xl shadow-sm animate-in fade-in">
                    <span className="text-2xl">✅</span>
                    <div>
                        <p className="font-bold text-base">¡Evaluación enviada correctamente!</p>
                        <p className="text-sm text-emerald-700 mt-0.5">Gracias por tu retroalimentación. Los datos han sido registrados en el sistema.</p>
                    </div>
                </div>
            )}

            {/* Banner de evaluación duplicada */}
            {error === "duplicada" && (
                <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 rounded-2xl shadow-sm animate-in fade-in">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="font-bold text-base">Evaluación ya registrada</p>
                        <p className="text-sm text-amber-800 mt-0.5">Ya has evaluado a este docente en esta materia. Solo puedes enviar una evaluación por materia.</p>
                    </div>
                </div>
            )}

            {/* Banner de error general */}
            {error === "general" && (
                <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-2xl shadow-sm animate-in fade-in">
                    <span className="text-2xl">❌</span>
                    <div>
                        <p className="font-bold text-base">Error al enviar la evaluación</p>
                        <p className="text-sm text-red-700 mt-0.5">Ocurrió un problema inesperado. Por favor intenta de nuevo más tarde.</p>
                    </div>
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        Gestión de Materias
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Administra el catálogo de asignaturas y su relación con los docentes.
                    </p>
                </div>
                <Link
                    href="/dashboard/materias/nuevo"
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95"
                >
                    + Nueva Materia
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                                <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Materia</th>
                                <th scope="col" className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Código</th>
                                <th scope="col" className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Cuatrimestre</th>
                                <th scope="col" className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Docente Titular</th>
                                <th scope="col" className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
                                <th scope="col" className="relative py-4 pl-3 pr-6"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {materias.map((materia) => (
                                <tr key={materia.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900 dark:text-white">
                                        {materia.name}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-500">
                                        {materia.code}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-indigo-900 dark:text-indigo-300">
                                            {materia.cuatrimestre}º
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                                                {materia.teacher.name.charAt(0)}{materia.teacher.lastName.charAt(0)}
                                            </div>
                                            {materia.teacher.name} {materia.teacher.lastName}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${materia.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${materia.isActive ? "bg-emerald-500" : "bg-red-500"}`}></span>
                                            {materia.isActive ? "Activa" : "Inactiva"}
                                        </span>
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium flex justify-end gap-4 items-center h-full min-h-[4rem]">
                                        <Link
                                            href={`/dashboard/materias/evaluar/${materia.id}`}
                                            className="text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            ⭐ Evaluar Docente
                                        </Link>
                                        <button className="text-red-600 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {materias.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        {/* Estado vacío con diseño atractivo */}
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-full mb-4">
                                                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Sin materias registradas</h3>
                                            <p className="text-gray-500 max-w-sm mx-auto mb-6">El catálogo de asignaturas está vacío. Agrega la primera materia e indica qué docente la imparte.</p>
                                            <Link href="/dashboard/materias/nuevo" className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all">
                                                + Registrar Materia
                                            </Link>
                                        </div>
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
