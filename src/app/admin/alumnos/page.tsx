import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AlumnosPage({
    searchParams,
}: {
    searchParams: { carrera?: string; grupo?: string; q?: string };
}) {
    const carreras = await prisma.career.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
    });

    const grupos = await prisma.group.findMany({
        where: {
            isActive: true,
            ...(searchParams.carrera ? { careerId: searchParams.carrera } : {}),
        },
        orderBy: { name: "asc" },
        include: { career: true },
    });

    // Construir filtro de alumnos
    const whereAlumnos: any = { isActive: true };
    if (searchParams.carrera) whereAlumnos.careerId = searchParams.carrera;
    if (searchParams.grupo) {
        whereAlumnos.groups = {
            some: { groupId: searchParams.grupo }
        };
    }
    if (searchParams.q) {
        whereAlumnos.OR = [
            { matricula: { contains: searchParams.q, mode: "insensitive" } },
            { name: { contains: searchParams.q, mode: "insensitive" } },
            { lastName: { contains: searchParams.q, mode: "insensitive" } },
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
        take: 100, // Paginación simple
    });

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
                <Link
                    href="/admin/alumnos/importar"
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                >
                    <span>📤</span> Importar CSV
                </Link>
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
                            defaultValue={searchParams.q}
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
                            defaultValue={searchParams.carrera}
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
                            defaultValue={searchParams.grupo}
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

                    {(searchParams.q || searchParams.carrera || searchParams.grupo) && (
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
                        Mostrando {alumnos.length} de {totalAlumnos} alumnos
                    </h2>
                    {alumnos.length === 100 && (
                        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-full">
                            ⚠️ Mostrando primeros 100 — usa los filtros para refinar
                        </span>
                    )}
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
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${alumno.isActive
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-slate-100 text-slate-400"
                                        }`}>
                                        {alumno.isActive ? "Activo" : "Inactivo"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {alumnos.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <p className="text-4xl mb-3">🎓</p>
                        <p className="font-bold">No se encontraron alumnos</p>
                        <p className="text-sm mt-1">
                            {searchParams.q || searchParams.carrera || searchParams.grupo
                                ? "Intenta con otros filtros"
                                : "Importa alumnos desde un archivo CSV"}
                        </p>
                        <Link
                            href="/admin/alumnos/importar"
                            className="inline-block mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                        >
                            📤 Importar CSV
                        </Link>
                    </div>
                )}
            </div>

        </div>
    );
}
