import Link from "next/link";
import { Prisma } from "@prisma/client";
import { ChevronLeft, ChevronRight, GraduationCap, Pencil, Plus, Upload } from "lucide-react";

import { getGroupDisplayMetadata } from "@/lib/groupDisplayName";
import { prisma } from "@/lib/prisma";
import { formatAcademicText } from "@/lib/text/academicText";
import { ResetStudentPasswordButton } from "./ResetStudentPasswordButton";

export default async function AlumnosPage({
    searchParams,
}: {
    searchParams: Promise<{ carrera?: string; grupo?: string; q?: string; page?: string; success?: string }>;
}) {
    const { carrera, grupo, q, page, success } = await searchParams;
    const currentPage = parseInt(page || "1", 10);
    const PAGE_SIZE = 50;
    const activePeriod = await prisma.period.findFirst({
        where: { isActive: true },
        select: { name: true },
    });

    const carreras = await prisma.career.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
    });

    const grupos = await prisma.group.findMany({
        where: {
            isActive: true,
            ...(carrera ? { careerId: carrera } : {}),
            ...(activePeriod?.name ? { period: activePeriod.name } : {}),
        },
        orderBy: { name: "asc" },
        include: { career: true },
    });

    const whereAlumnos: Prisma.StudentWhereInput = { isActive: true };
    if (carrera) {
        whereAlumnos.careerId = carrera;
    }
    if (grupo) {
        whereAlumnos.groups = {
            some: { groupId: grupo },
        };
    }
    if (q) {
        whereAlumnos.OR = [
            { matricula: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
        ];
    }

    const alumnos = await prisma.student.findMany({
        where: whereAlumnos,
        orderBy: [{ career: { code: "asc" } }, { lastName: "asc" }],
        include: {
            career: true,
            user: {
                select: {
                    canChangeInitialPassword: true,
                },
            },
            groups: {
                where: activePeriod?.name
                    ? {
                          group: {
                              period: activePeriod.name,
                          },
                      }
                    : undefined,
                include: {
                    group: {
                        include: {
                            career: true,
                        },
                    },
                },
                orderBy: {
                    group: {
                        name: "asc",
                    },
                },
                take: 1,
            },
        },
        take: PAGE_SIZE,
        skip: (currentPage - 1) * PAGE_SIZE,
    });

    const totalFiltered = await prisma.student.count({ where: whereAlumnos });
    const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);
    const totalAlumnos = await prisma.student.count({ where: { isActive: true } });

    const buildPageHref = (targetPage: number) => {
        const params = new URLSearchParams();
        params.set("page", String(targetPage));

        if (q) {
            params.set("q", q);
        }
        if (carrera) {
            params.set("carrera", carrera);
        }
        if (grupo) {
            params.set("grupo", grupo);
        }

        return `/admin/alumnos?${params.toString()}`;
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">
                        Gestión de <span className="text-blue-600">Alumnos</span>
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        {totalAlumnos} alumnos registrados en el sistema
                    </p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                    <Link
                        href="/admin/alumnos/nuevo"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95 sm:w-auto"
                    >
                        <Plus size={16} />
                        Nuevo Alumno
                    </Link>
                    <Link
                        href="/admin/alumnos/importar"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 transition-all hover:bg-indigo-100 sm:w-auto"
                    >
                        <Upload size={16} />
                        Importar CSV
                    </Link>
                </div>
            </div>

            {success === "actualizado" && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
                    El alumno se actualizo correctamente.
                </div>
            )}

            {success === "creado" && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
                    El alumno se registró correctamente con una contraseña temporal.
                </div>
            )}

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <form className="flex flex-wrap items-end gap-3">
                    <div className="min-w-48 flex-1">
                        <label className="mb-1.5 block text-xs font-bold text-slate-500">
                            Buscar
                        </label>
                        <input
                            name="q"
                            defaultValue={q}
                            placeholder="Matrícula, nombre o apellido..."
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-500">
                            Carrera
                        </label>
                        <select
                            name="carrera"
                            defaultValue={carrera}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Todas las carreras</option>
                            {carreras.map((career) => (
                                <option key={career.id} value={career.id}>
                                    {career.code} - {formatAcademicText(career.name)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-500">
                            Grupo
                        </label>
                        <select
                            name="grupo"
                            defaultValue={grupo}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Todos los grupos</option>
                            {grupos.map((currentGroup) => {
                                const { displayName } = getGroupDisplayMetadata(
                                    currentGroup.name,
                                    currentGroup.career.code,
                                );

                                return (
                                    <option key={currentGroup.id} value={currentGroup.id}>
                                        {currentGroup.career.code} - {displayName} ({currentGroup.period})
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-700 active:scale-95"
                    >
                        Filtrar
                    </button>

                    {(q || carrera || grupo) && (
                        <Link
                            href="/admin/alumnos"
                            className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 transition-all hover:bg-slate-100"
                        >
                            Limpiar
                        </Link>
                    )}
                </form>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="font-bold text-slate-700">
                        Mostrando {alumnos.length} resultados (Total: {totalFiltered})
                    </h2>
                </div>

                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                                Matricula
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                                Nombre
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                                Carrera
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                                Grupo
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {alumnos.map((alumno) => (
                            <tr key={alumno.id} className="transition-colors hover:bg-slate-50/50">
                                <td className="px-6 py-3">
                                    <span className="font-mono text-sm font-bold text-slate-700">
                                        {alumno.matricula}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    <p className="text-sm font-semibold text-slate-800">
                                        {alumno.name} {alumno.lastName}
                                    </p>
                                    {alumno.user.canChangeInitialPassword && (
                                        <p className="mt-1 text-xs font-bold text-amber-600">
                                            Contraseña temporal activa
                                        </p>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-black text-indigo-700">
                                        {alumno.career.code}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {alumno.groups[0]?.group ? (
                                        (() => {
                                            const { displayName, accessibilityLabel } =
                                                getGroupDisplayMetadata(
                                                    alumno.groups[0].group.name,
                                                    alumno.groups[0].group.career.code,
                                                );

                                            return (
                                                <span
                                                    className="text-sm text-slate-500"
                                                    aria-label={accessibilityLabel}
                                                    title={accessibilityLabel}
                                                >
                                                    {displayName}
                                                </span>
                                            );
                                        })()
                                    ) : (
                                        <span className="text-sm text-slate-500">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {alumno.isActive ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                            Inactivo
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/admin/alumnos/${alumno.id}/editar`}
                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                        >
                                            <Pencil size={13} />
                                            Editar
                                        </Link>
                                        <ResetStudentPasswordButton
                                            studentId={alumno.id}
                                            studentName={`${alumno.name} ${alumno.lastName}`}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {alumnos.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                        <GraduationCap className="mb-3 h-10 w-10 text-slate-300" />
                        <p className="font-bold">No se encontraron alumnos</p>
                        <p className="mt-1 text-sm">
                            {q || carrera || grupo
                                ? "Intenta con otros filtros"
                                : "Importa alumnos desde un archivo CSV"}
                        </p>
                        <Link
                            href="/admin/alumnos/importar"
                            className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700"
                        >
                            <Upload className="mr-1 inline h-4 w-4" />
                            Importar CSV
                        </Link>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                        <span className="text-sm font-medium text-slate-500">
                            Página {currentPage} de {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            {currentPage > 1 ? (
                                <Link
                                    href={buildPageHref(currentPage - 1)}
                                    className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50"
                                >
                                    <ChevronLeft size={18} />
                                </Link>
                            ) : (
                                <button
                                    disabled
                                    className="cursor-not-allowed rounded-lg border border-slate-100 p-2 text-slate-300"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                            )}
                            {currentPage < totalPages ? (
                                <Link
                                    href={buildPageHref(currentPage + 1)}
                                    className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50"
                                >
                                    <ChevronRight size={18} />
                                </Link>
                            ) : (
                                <button
                                    disabled
                                    className="cursor-not-allowed rounded-lg border border-slate-100 p-2 text-slate-300"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
