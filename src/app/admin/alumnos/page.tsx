import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Upload, AlertTriangle, GraduationCap, Plus, ChevronLeft, ChevronRight } from "lucide-react";

export default async function AlumnosPage({
    searchParams,
}: {
    searchParams: Promise<{ carrera?: string; grupo?: string; q?: string; page?: string }>;
}) {
    const { carrera, grupo, q, page } = await searchParams;
    const currentPage = parseInt(page || "1", 10);
    const PAGE_SIZE = 50;

    const carreras = await prisma.career.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
    });

    const grupos = await prisma.group.findMany({
        where: {
            isActive: true,
            ...(carrera ? { careerId: carrera } : {}),
        },
        orderBy: { name: "asc" },
        include: { career: true },
    });

    // Construir filtro de alumnos
    const whereAlumnos: any = { isActive: true };
    if (carrera) whereAlumnos.careerId = carrera;
    if (grupo) {
        whereAlumnos.groups = {
            some: { groupId: grupo }
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
            groups: {
                include: { group: true },
                take: 1, // Solo el grupo más reciente
            },
        },
        take: PAGE_SIZE,
        skip: (currentPage - 1) * PAGE_SIZE,
    });

    const totalFiltered = await prisma.student.count({ where: whereAlumnos });
    const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);

    const totalAlumnos = await prisma.student.count({ where: { isActive: true } });

    return (
        <div className="p-8 space-y-6">

            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">
                        Gestión de <span className="text-blue-600">Alumnos</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {totalAlumnos} alumnos registrados en el sistema
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/alumnos/nuevo"
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        <Plus size={16} /> Nuevo Alumno
                    </Link>
                    <Link
                        href="/admin/alumnos/importar"
                        className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all font-sans"
                    >
                        <Upload size={16} /> Importar CSV
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <form className="flex gap-3 flex-wrap items-end">
                    {/* Búsqueda */}
                    <div className="flex-1 min-w-48">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                            Buscar
                        </label>
                        <input
                            name="q"
                            defaultValue={q}
                            placeholder="Matrícula, nombre o apellido..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        />
                    </div>

                    {/* Carrera */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                            Carrera
                        </label>
                        <select
                            name="carrera"
                            defaultValue={carrera}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        >
                            <option value="">Todas las carreras</option>
                            {carreras.map(c => (
                                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Grupo */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                            Grupo
                        </label>
                        <select
                            name="grupo"
                            defaultValue={grupo}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        >
                            <option value="">Todos los grupos</option>
                            {grupos.map(g => (
                                <option key={g.id} value={g.id}>
                                    {g.career.code} — {g.name} ({g.period})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700 active:scale-95 transition-all"
                    >
                        Filtrar
                    </button>

                    {(q || carrera || grupo) && (
                        <Link
                            href="/admin/alumnos"
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                        >
                            Limpiar
                        </Link>
                    )}
                </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-700">
                        Mostrando {alumnos.length} resultados (Total: {totalFiltered})
                    </h2>
                </div>

                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Matrícula</th>
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                            <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Carrera</th>
                            <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Grupo</th>
                            <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {alumnos.map((alumno) => (
                            <tr key={alumno.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-3">
                                    <span className="font-mono text-sm font-bold text-slate-700">
                                        {alumno.matricula}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    <p className="font-semibold text-slate-800 text-sm">
                                        {alumno.name} {alumno.lastName}
                                    </p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="bg-indigo-50 text-indigo-700 font-black text-xs px-2 py-1 rounded-lg">
                                        {alumno.career.code}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-sm text-slate-500">
                                        {alumno.groups[0]?.group.name ?? "—"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {alumno.isActive ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-500 border border-slate-100">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                            Inactivo
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {alumnos.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <GraduationCap className="w-10 h-10 mb-3 text-slate-300" />
                        <p className="font-bold">No se encontraron alumnos</p>
                        <p className="text-sm mt-1">
                            {q || carrera || grupo
                                ? "Intenta con otros filtros"
                                : "Importa alumnos desde un archivo CSV"}
                        </p>
                        <Link
                            href="/admin/alumnos/importar"
                            className="inline-block mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                        >
                            <Upload className="w-4 h-4 inline mr-1" /> Importar CSV
                        </Link>
                    </div>
                )}

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">
                            Página {currentPage} de {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            {currentPage > 1 ? (
                                <Link
                                    href={`/admin/alumnos?page=${currentPage - 1}${q ? `&q=${q}` : ''}${carrera ? `&carrera=${carrera}` : ''}${grupo ? `&grupo=${grupo}` : ''}`}
                                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
                                >
                                    <ChevronLeft size={18} />
                                </Link>
                            ) : (
                                <button disabled className="p-2 border border-slate-100 rounded-lg text-slate-300 cursor-not-allowed">
                                    <ChevronLeft size={18} />
                                </button>
                            )}
                            {currentPage < totalPages ? (
                                <Link
                                    href={`/admin/alumnos?page=${currentPage + 1}${q ? `&q=${q}` : ''}${carrera ? `&carrera=${carrera}` : ''}${grupo ? `&grupo=${grupo}` : ''}`}
                                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
                                >
                                    <ChevronRight size={18} />
                                </Link>
                            ) : (
                                <button disabled className="p-2 border border-slate-100 rounded-lg text-slate-300 cursor-not-allowed">
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
