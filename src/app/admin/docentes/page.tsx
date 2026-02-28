// src/app/admin/docentes/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DeleteTeacherButton } from "./DeleteTeacherButton";

export const dynamic = "force-dynamic";

export default async function DocentesPage() {
    const teachers = await prisma.teacher.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            career: true,
            user: { select: { email: true } },
        },
    });

    return (
        <div className="p-8 pb-20 sm:p-12 animate-in fade-in zoom-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        Gestión de Docentes
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Administra los catedráticos registrados en el sistema de evaluación.
                    </p>
                </div>
                <Link
                    href="/admin/docentes/nuevo"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 transition-all hover:scale-105 active:scale-95"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Nuevo Docente
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="py-4 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Nombre completo
                                </th>
                                <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Email / No. Empleado
                                </th>
                                <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Carrera
                                </th>
                                <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Estado
                                </th>
                                <th className="relative py-4 pl-3 pr-6">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {teachers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-gray-400 font-medium">
                                        <p className="text-3xl mb-2">👨‍🏫</p>
                                        No hay docentes registrados aún.{" "}
                                        <Link href="/admin/docentes/nuevo" className="text-blue-600 hover:underline font-semibold">
                                            Registra el primero
                                        </Link>
                                    </td>
                                </tr>
                            )}
                            {teachers.map((teacher) => (
                                <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors group">
                                    {/* Avatar + Nombre */}
                                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-inner text-xs">
                                                    {teacher.name.charAt(0)}{teacher.lastName.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-medium text-gray-900">
                                                    {teacher.name} {teacher.lastName}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Email / No. Empleado */}
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <div className="text-gray-700 text-xs">{teacher.user.email ?? "—"}</div>
                                        <div className="font-mono text-xs text-gray-400 mt-0.5">{teacher.employeeId}</div>
                                    </td>
                                    {/* Carrera */}
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                            {teacher.career.code}
                                        </span>
                                        <div className="text-gray-400 text-xs mt-1 truncate max-w-[160px]">{teacher.career.name}</div>
                                    </td>
                                    {/* Estado */}
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${teacher.isActive
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-red-50 text-red-700 border-red-200"
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${teacher.isActive ? "bg-emerald-500" : "bg-red-500"}`}></span>
                                            {teacher.isActive ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>
                                    {/* Acciones */}
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                                        <DeleteTeacherButton teacherId={teacher.id} teacherName={`${teacher.name} ${teacher.lastName}`} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
