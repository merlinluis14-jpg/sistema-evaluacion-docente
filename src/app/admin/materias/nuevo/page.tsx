// src/app/admin/materias/nuevo/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createSubject } from "../actions";

export const dynamic = "force-dynamic";

export default async function NuevaMateriaPage() {
    const [teachers, careers] = await Promise.all([
        prisma.teacher.findMany({
            where: { isActive: true },
            include: { career: true },
            orderBy: { name: "asc" },
        }),
        prisma.career.findMany({
            where: { isActive: true },
            orderBy: { code: "asc" },
        }),
    ]);

    const inputClass = "block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm bg-gray-50 transition-all";
    const labelClass = "block text-sm font-medium leading-6 text-gray-900";

    return (
        <div className="p-8 pb-20 sm:p-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <Link
                    href="/admin/materias"
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4"
                >
                    <svg className="mr-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver a Materias
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Registrar Nueva Materia</h1>
                <p className="text-gray-500 mt-2">Ingresa los datos de la asignatura y asocia docente y carrera.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <form action={createSubject as unknown as (formData: FormData) => void} className="space-y-6">
                    {/* Nombre */}
                    <div className="sm:col-span-2">
                        <label htmlFor="name" className={labelClass}>Nombre de la Materia</label>
                        <div className="mt-2">
                            <input type="text" name="name" id="name" required className={inputClass} placeholder="Ej. Cálculo Diferencial" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Código */}
                        <div>
                            <label htmlFor="code" className={labelClass}>Código Institucional</label>
                            <div className="mt-2">
                                <input type="text" name="code" id="code" required className={inputClass} placeholder="Ej. MAT-101" />
                            </div>
                        </div>
                        {/* Cuatrimestre */}
                        <div>
                            <label htmlFor="cuatrimestre" className={labelClass}>Cuatrimestre</label>
                            <div className="mt-2">
                                <select id="cuatrimestre" name="cuatrimestre" required defaultValue="" className={inputClass + " cursor-pointer py-3"}>
                                    <option value="" disabled>Selecciona...</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                        <option key={n} value={n}>{n}º Cuatrimestre</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Carrera */}
                    <div>
                        <label htmlFor="careerId" className={labelClass}>Carrera</label>
                        <div className="mt-2">
                            <select id="careerId" name="careerId" required defaultValue="" className={inputClass + " cursor-pointer py-3"}>
                                <option value="" disabled>Selecciona una carrera...</option>
                                {careers.length === 0 ? (
                                    <option value="" disabled>No hay carreras registradas</option>
                                ) : careers.map(c => (
                                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                                ))}
                            </select>
                        </div>
                        {careers.length === 0 && (
                            <p className="mt-2 text-sm text-amber-600 font-medium">
                                ⚠️ Necesitas registrar carreras primero.
                            </p>
                        )}
                    </div>

                    {/* Docente */}
                    <div>
                        <label htmlFor="teacherId" className={labelClass}>Docente Asignado</label>
                        <div className="mt-2">
                            <select id="teacherId" name="teacherId" required defaultValue="" className={inputClass + " cursor-pointer py-3"}>
                                <option value="" disabled>Selecciona un catedrático...</option>
                                {teachers.length === 0 ? (
                                    <option value="" disabled>No hay docentes disponibles</option>
                                ) : teachers.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} {t.lastName} — {t.career.code} ({t.employeeId})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {teachers.length === 0 && (
                            <p className="mt-2 text-sm text-red-600 font-medium">
                                ⚠️ Registra al menos un docente antes de crear materias.
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 mt-6 pt-6">
                        <Link href="/admin/materias" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={teachers.length === 0 || careers.length === 0}
                            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            Guardar Materia
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
