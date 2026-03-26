
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DeleteTeacherButton } from "./DeleteTeacherButton";
import { ResetPasswordButton } from "./ResetPasswordButton";
import { UserCog, Plus, Upload } from "lucide-react";

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
                    <h1 className="text-3xl font-black text-slate-800">
                        Gestión de <span className="text-blue-600">Docentes</span>
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Administra los catedráticos registrados en el sistema de evaluación.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/admin/docentes/importar"
                        className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all font-sans"
                    >
                        <Upload size={16} />
                        Importar CSV
                    </Link>
                    <Link
                        href="/admin/docentes/nuevo"
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        <Plus size={16} />
                        Nuevo Docente
                    </Link>
                </div>
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
                                        <UserCog className="w-10 h-10 mb-2 text-slate-300 mx-auto" />
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
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-slate-100 text-slate-500 border-slate-200"
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${teacher.isActive ? "bg-emerald-500" : "bg-red-500"}`}></span>
                                            {teacher.isActive ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>
                                    {/* Acciones */}
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <ResetPasswordButton teacherId={teacher.id} teacherName={`${teacher.name} ${teacher.lastName}`} />
                                            <DeleteTeacherButton teacherId={teacher.id} teacherName={`${teacher.name} ${teacher.lastName}`} />
                                        </div>
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
