"use client";

import { createTeacher } from "../actions";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Career = { id: string; code: string; name: string };

export default function NuevoDocentePage() {
    const [loading, setLoading] = useState(false);
    const [careers, setCareers] = useState<Career[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/careers").then(r => r.json()).then(setCareers).catch(() => setCareers([]));
    }, []);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const result = await createTeacher(formData);
            if (result.success) {
                router.push("/admin/docentes");
            } else {
                alert(result.error || "Error al registrar docente");
            }
        } catch {
            alert("Error al registrar docente");
        } finally {
            setLoading(false);
        }
    }

    const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none";
    const labelClass = "text-sm font-semibold text-gray-700";

    return (
        <div className="p-8 pb-20 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
            <div className="mb-8">
                <Link
                    href="/admin/docentes"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 mb-4 inline-flex items-center gap-1 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1">
                        <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                    </svg>
                    Volver a la lista
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mt-2">
                    Registrar Nuevo Docente
                </h1>
                <p className="text-gray-500 mt-2">
                    Se creará un usuario con rol DOCENTE. La contraseña temporal será su número de empleado.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <form action={handleSubmit} className="p-8 space-y-6">
                    {/* Nombre y Apellidos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className={labelClass}>Nombre(s)</label>
                            <input type="text" id="name" name="name" required className={inputClass} placeholder="Ej. Juan" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="lastName" className={labelClass}>Apellidos</label>
                            <input type="text" id="lastName" name="lastName" required className={inputClass} placeholder="Ej. Pérez García" />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label htmlFor="email" className={labelClass}>Correo Electrónico Institucional</label>
                        <input type="email" id="email" name="email" required className={inputClass} placeholder="juan.perez@uptx.edu.mx" />
                        <p className="text-xs text-gray-400">Este será el usuario de inicio de sesión del docente.</p>
                    </div>

                    {/* Núm. Empleado y Carrera */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="employeeId" className={labelClass}>Número de Empleado</label>
                            <input type="text" id="employeeId" name="employeeId" required className={inputClass} placeholder="Ej. E1234567" />
                            <p className="text-xs text-gray-400">También será la contraseña temporal.</p>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="careerId" className={labelClass}>Carrera Principal</label>
                            <select id="careerId" name="careerId" required className={inputClass}>
                                <option value="">Selecciona una carrera</option>
                                {careers.map(c => (
                                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-4">
                        <Link
                            href="/admin/docentes"
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Guardando...
                                </span>
                            ) : "Guardar Docente"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
