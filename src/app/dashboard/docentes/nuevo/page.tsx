"use client";

import { createTeacher } from "../actions";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoDocentePage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const result = await createTeacher(formData);
            if (result.success) {
                router.push("/dashboard/docentes");
            } else {
                alert(result.error || "Error al registrar docente");
            }
        } catch (error) {
            console.error(error);
            alert("Error al registrar docente");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 pb-20 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
            <div className="mb-8">
                <Link
                    href="/dashboard/docentes"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 mb-4 inline-flex items-center gap-1 group"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4 transition-transform group-hover:-translate-x-1"
                    >
                        <path
                            fillRule="evenodd"
                            d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Volver a la lista
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-2">
                    Registrar Nuevo Docente
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Completa los siguientes campos para dar de alta a un catedrático en el sistema.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <form action={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="name"
                                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                                Nombre(s)
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="Ej. Juan"
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="lastName"
                                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                                Apellidos
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="Ej. Pérez García"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="email"
                            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                        >
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            placeholder="juan.perez@uptx.edu.mx"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="employeeId"
                                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                                Matrícula o Número de Empleado
                            </label>
                            <input
                                type="text"
                                id="employeeId"
                                name="employeeId"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="Ej. E1234567"
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="department"
                                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                                Carrera o Departamento
                            </label>
                            <select
                                id="department"
                                name="department"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            >
                                <option value="">Selecciona una carrera</option>
                                <option value="Ingeniería en Sistemas Automotrices">Ingeniería en Sistemas Automotrices</option>
                                <option value="Ingeniería en Tecnologías de la Información">Ingeniería en Tecnologías de la Información</option>
                                <option value="Ingeniería Industrial">Ingeniería Industrial</option>
                                <option value="Ingeniería Mecatrónica">Ingeniería Mecatrónica</option>
                                <option value="Ingeniería Química">Ingeniería Química</option>
                                <option value="Ingeniería Biotecnología">Ingeniería Biotecnología</option>
                                <option value="Ingeniería Financiera">Ingeniería Financiera</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-4">
                        <Link
                            href="/dashboard/docentes"
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Guardando...
                                </span>
                            ) : (
                                "Guardar Docente"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
