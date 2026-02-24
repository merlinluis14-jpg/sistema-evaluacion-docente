import { prisma } from "@/lib/prisma";
import { Teacher } from "@prisma/client";
import Link from "next/link";
import { DeleteTeacherButton } from "./DeleteTeacherButton";

export default async function DocentesPage() {
    // Obtenemos los docentes registrados en la BD, ordenados por fecha de creación
    const teachers = (await prisma.teacher.findMany({
        orderBy: { createdAt: "desc" },
    })) as any[];

    return (
        <div className="p-8 pb-20 sm:p-12 animate-in fade-in zoom-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        Gestión de Docentes
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Administra los catedráticos registrados en el sistema de evaluación.
                    </p>
                </div>
                <Link
                    href="/dashboard/docentes/nuevo"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all hover:scale-105 active:scale-95"
                >
                    <svg
                        className="-ml-1 mr-2 h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Nuevo Docente
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                                <th
                                    scope="col"
                                    className="py-4 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                >
                                    Nombre completo
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                >
                                    Contacto
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                >
                                    Matrícula / Depto.
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                >
                                    Estado
                                </th>
                                <th scope="col" className="relative py-4 pl-3 pr-6">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {teachers.map((teacher) => (
                                <tr
                                    key={teacher.id}
                                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group"
                                >
                                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-inner">
                                                    {teacher.name.charAt(0)}
                                                    {teacher.lastName.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {teacher.name} {teacher.lastName}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                className="w-4 h-4"
                                            >
                                                <path d="M3 4a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H3zm0 1.068l6.804 4.884a2 2 0 002.392 0L19 5.068V14a1 1 0 01-1 1H3a1 1 0 01-1-1V5.068z" />
                                            </svg>
                                            {teacher.email}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <div className="text-gray-900 dark:text-white font-medium">
                                            {teacher.employeeId}
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                                            {teacher.department}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${teacher.isActive
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                                                }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${teacher.isActive
                                                    ? "bg-emerald-500 dark:bg-emerald-400"
                                                    : "bg-red-500 dark:bg-red-400"
                                                    }`}
                                            ></span>
                                            {teacher.isActive ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity mr-3">
                                            Editar<span className="sr-only">, {teacher.name}</span>
                                        </button>
                                        <DeleteTeacherButton teacherId={teacher.id} teacherName={`${teacher.name} ${teacher.lastName}`} />
                                    </td>
                                </tr>
                            ))}

                            {teachers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-full mb-4">
                                                <svg
                                                    className="w-8 h-8 text-gray-400 dark:text-gray-500"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="1.5"
                                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                                Ningún docente registrado
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-6">
                                                Aún no tienes a ningún profesor en el sistema. Agrega a tu
                                                primer docente para empezar a gestionar sus grupos.
                                            </p>
                                            <Link
                                                href="/dashboard/docentes/nuevo"
                                                className="inline-flex items-center rounded-lg bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium"
                                            >
                                                + Registrar Docente
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
