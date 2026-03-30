import Link from "next/link";
import { BookOpen, FilterX, Layers3, Plus, Upload, UserCog } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DeleteTeacherButton } from "./DeleteTeacherButton";
import { ResetPasswordButton } from "./ResetPasswordButton";

export const dynamic = "force-dynamic";

export default async function DocentesPage({
    searchParams,
}: {
    searchParams: Promise<{ career?: string }>;
}) {
    const { career: careerId } = await searchParams;

    const teachers = await prisma.teacher.findMany({
        where: careerId ? { careerId } : undefined,
        orderBy: [{ lastName: "asc" }, { name: "asc" }],
        include: {
            career: true,
            user: { select: { email: true } },
            subjects: {
                where: { isActive: true },
                include: {
                    groups: {
                        include: {
                            group: true,
                        },
                    },
                },
            },
        },
    });

    const activeCareer = careerId
        ? await prisma.career.findUnique({ where: { id: careerId }, select: { name: true, code: true } })
        : null;

    const teacherRows = teachers.map((teacher) => {
        const groupMap = new Map<string, { id: string; name: string; period: string }>();

        for (const subject of teacher.subjects) {
            for (const groupSubject of subject.groups) {
                groupMap.set(groupSubject.group.id, {
                    id: groupSubject.group.id,
                    name: groupSubject.group.name,
                    period: groupSubject.group.period,
                });
            }
        }

        return {
            ...teacher,
            activeSubjects: teacher.subjects
                .map((subject) => ({ id: subject.id, code: subject.code, name: subject.name }))
                .sort((a, b) => a.name.localeCompare(b.name, "es")),
            assignedGroups: Array.from(groupMap.values()).sort((a, b) => a.name.localeCompare(b.name, "es")),
        };
    });

    return (
        <div className="mx-auto max-w-7xl animate-in fade-in zoom-in p-4 pb-20 duration-500 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">
                        Gestion de <span className="text-blue-600">Docentes</span>
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Administra los catedraticos registrados en el sistema de evaluacion.
                    </p>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    <Link
                        href="/admin/docentes/importar"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 transition-all hover:bg-indigo-100 sm:w-auto"
                    >
                        <Upload size={16} />
                        Importar CSV
                    </Link>
                    <Link
                        href="/admin/docentes/nuevo"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95 sm:w-auto"
                    >
                        <Plus size={16} />
                        Nuevo Docente
                    </Link>
                </div>
            </div>

            {activeCareer && (
                <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-5 py-3 text-sm font-medium">
                    <FilterX size={16} className="shrink-0 text-blue-500" />
                    <span>
                        Mostrando docentes de la carrera: <strong>{activeCareer.code} - {activeCareer.name}</strong>
                    </span>
                    <Link
                        href="/admin/docentes"
                        className="ml-auto text-blue-600 hover:text-blue-800 font-bold underline underline-offset-2 whitespace-nowrap"
                    >
                        Ver todos
                    </Link>
                </div>
            )}

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
                                    Tipo
                                </th>
                                <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Asignaciones
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
                                    <td colSpan={7} className="py-16 text-center text-gray-400 font-medium">
                                        <UserCog className="w-10 h-10 mb-2 text-slate-300 mx-auto" />
                                        No hay docentes registrados aun.{" "}
                                        <Link href="/admin/docentes/nuevo" className="text-blue-600 hover:underline font-semibold">
                                            Registra el primero
                                        </Link>
                                    </td>
                                </tr>
                            )}
                            {teacherRows.map((teacher) => (
                                <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors group">
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
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <div className="text-gray-700 text-xs">{teacher.user.email ?? "-"}</div>
                                        <div className="font-mono text-xs text-gray-400 mt-0.5">{teacher.employeeId}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                            {teacher.career.code}
                                        </span>
                                        <div className="text-gray-400 text-xs mt-1 truncate max-w-[160px]">{teacher.career.name}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${
                                                teacher.position === "PTC"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                    : "bg-sky-50 text-sky-700 border-sky-200"
                                            }`}
                                        >
                                            {teacher.position}
                                        </span>
                                        <div className="text-gray-400 text-xs mt-1">
                                            {teacher.position === "PTC" ? "Tiempo completo" : "Asignatura"}
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 text-sm">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 px-2.5 py-1 text-xs font-bold">
                                                    <BookOpen size={12} />
                                                    {teacher.activeSubjects.length} materias
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-bold">
                                                    <Layers3 size={12} />
                                                    {teacher.assignedGroups.length} grupos
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 max-w-[260px]">
                                                {teacher.assignedGroups.length > 0 ? (
                                                    teacher.assignedGroups.slice(0, 4).map((group) => (
                                                        <span
                                                            key={group.id}
                                                            className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 text-xs font-bold"
                                                            title={group.period}
                                                        >
                                                            {group.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400">Sin grupos enlazados</span>
                                                )}
                                                {teacher.assignedGroups.length > 4 && (
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 text-xs font-bold">
                                                        +{teacher.assignedGroups.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                                                teacher.isActive
                                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${teacher.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                                            {teacher.isActive ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>
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
