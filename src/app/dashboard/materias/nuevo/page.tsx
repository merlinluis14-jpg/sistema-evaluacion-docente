import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createSubject } from "../actions";

export default async function NuevaMateriaPage() {
    // Traemos de la base de datos todos los profesores que estén activos (isActive: true)
    const teachers = await prisma.teacher.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
    });

    return (
        <div className="p-8 pb-20 sm:p-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <Link
                    href="/dashboard/materias"
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4"
                >
                    <svg className="mr-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver a Materias
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Registrar Nueva Materia
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Ingresa los datos de la asignatura y asocia un docente titular.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                <form action={createSubject as any} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Nombre de la Materia */}
                        <div className="sm:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                Nombre de la Materia
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:ring-gray-600 dark:text-white transition-all bg-gray-50"
                                    placeholder="Ej. Cálculo Diferencial"
                                />
                            </div>
                        </div>

                        {/* Código */}
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                Código Institucional
                            </label>
                            <div className="mt-2 text-red">
                                <input
                                    type="text"
                                    name="code"
                                    id="code"
                                    required
                                    className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:ring-gray-600 dark:text-white transition-all bg-gray-50"
                                    placeholder="Ej. MAT-101"
                                />
                            </div>
                        </div>

                        {/* Cuatrimestre */}
                        <div>
                            <label htmlFor="cuatrimestre" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                Cuatrimestre
                            </label>
                            <div className="mt-2">
                                <select
                                    id="cuatrimestre"
                                    name="cuatrimestre"
                                    required
                                    defaultValue=""
                                    className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:ring-gray-600 dark:text-white transition-all bg-gray-50 bg-none cursor-pointer"
                                >
                                    <option value="" disabled>Selecciona un cuatrimestre</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <option key={num} value={num}>
                                            {num}º Cuatrimestre
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Docente Mapeado de DB */}
                        <div className="sm:col-span-2">
                            <label htmlFor="teacherId" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                Docente Asignado
                            </label>
                            <div className="mt-2">
                                <select
                                    id="teacherId"
                                    name="teacherId"
                                    required
                                    defaultValue=""
                                    className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:ring-gray-600 dark:text-white transition-all bg-gray-50 cursor-pointer"
                                >
                                    <option value="" disabled>Selecciona un catedrático...</option>
                                    {teachers.length === 0 ? (
                                        <option value="" disabled>No hay docentes disponibles (Registra uno primero)</option>
                                    ) : (
                                        teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.name} {teacher.lastName} ({teacher.employeeId})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            {teachers.length === 0 && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                                    ⚠️ Necesitas registrar al menos un docente antes de crear materias.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-x-6 border-t border-gray-900/10 dark:border-white/10 mt-6 pt-6">
                        <Link
                            href="/dashboard/materias"
                            className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-300 hover:text-gray-600 transition-colors"
                        >
                            Cancelar
                        </Link>
                        {/* Botón Guardar - Deshabilitado si no hay docentes */}
                        <button
                            type="submit"
                            disabled={teachers.length === 0}
                            className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all
                                ${teachers.length === 0
                                    ? "bg-gray-400 cursor-not-allowed opacity-50"
                                    : "bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                }`
                            }
                        >
                            Guardar Materia
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
