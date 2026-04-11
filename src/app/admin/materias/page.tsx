import Link from "next/link";
import { BookOpen, CloudDownload, Pencil } from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MateriasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ carrera?: string; q?: string }>;
}) {
  const { carrera, q } = await searchParams;

  const carreras = await prisma.career.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  const materias = await prisma.subject.findMany({
    where: {
      ...(carrera ? { careerId: carrera } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { code: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      teacher: true,
      career: true,
      groups: {
        where: {
          teacherId: { not: null },
        },
        include: {
          teacher: true,
        },
      },
    },
    orderBy: [{ career: { code: "asc" } }, { cuatrimestre: "asc" }],
  });

  const totalMaterias = await prisma.subject.count();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Gestion de <span className="text-blue-600">Materias</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {totalMaterias} materias registradas en el sistema
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link
            href="/admin/docentes/sincronizar"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100 sm:w-auto"
          >
            <CloudDownload size={16} /> Sincronizar academia
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800 shadow-sm">
        Las materias ya no deben capturarse ni importarse manualmente aqui. El
        catalogo academico se alimenta desde Horarios y la relacion exacta
        docente-materia-grupo se sincroniza desde ese sistema maestro.
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="mb-1.5 block text-xs font-bold text-slate-500">
              Buscar
            </label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Nombre o codigo de materia..."
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
                  {career.code} - {career.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-800 active:scale-95"
          >
            Filtrar
          </button>

          {(q || carrera) && (
            <Link
              href="/admin/materias"
              className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-slate-700">
            Mostrando {materias.length} de {totalMaterias} materias
          </h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                Codigo
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                Materia
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                Carrera
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                Cuatrimestre
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                Docente asignado
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                Estado
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {materias.map((materia) => (
              <tr key={materia.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-3">
                  <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-500">
                    {materia.code}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{materia.name}</p>
                </td>

                <td className="px-4 py-3 text-center">
                  <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-black text-indigo-700">
                    {materia.career.code}
                  </span>
                </td>

                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-bold text-slate-600">
                    {materia.cuatrimestre}°
                  </span>
                </td>

                <td className="px-4 py-3">
                  {(() => {
                    const uniqueTeachers = Array.from(
                      new Map(
                        materia.groups
                          .filter((groupSubject) => groupSubject.teacher)
                          .map((groupSubject) => [
                            groupSubject.teacher!.id,
                            groupSubject.teacher!,
                          ]),
                      ).values(),
                    );

                    if (uniqueTeachers.length > 1) {
                      return (
                        <div className="text-sm text-slate-600">
                          <div className="font-semibold text-slate-700">
                            {uniqueTeachers.length} docentes asignados
                          </div>
                          <div className="text-xs text-slate-400">
                            La asignacion exacta depende del grupo.
                          </div>
                        </div>
                      );
                    }

                    const teacher = uniqueTeachers[0] ?? materia.teacher;
                    if (!teacher) {
                      return (
                        <span className="text-sm text-slate-400">
                          Sin docente primario
                        </span>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-black text-white">
                          {teacher.name[0]}
                          {teacher.lastName[0]}
                        </div>
                        <span className="text-sm text-slate-600">
                          {teacher.name} {teacher.lastName}
                        </span>
                      </div>
                    );
                  })()}
                </td>

                <td className="px-4 py-3 text-center">
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-bold ${
                      materia.isActive
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-100 text-slate-500"
                    }`}
                  >
                    {materia.isActive ? "Activa" : "Inactiva"}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/materias/${materia.id}/editar`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                  >
                    <Pencil size={14} /> Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {materias.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-600">No se encontraron materias</p>
            <p className="mt-1 text-sm">
              {q || carrera
                ? "Intenta con otros filtros"
                : "Sincroniza el catalogo academico desde Horarios"}
            </p>
            <Link
              href="/admin/docentes/sincronizar"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-700/20 transition-all hover:scale-105 hover:bg-blue-800 active:scale-95"
            >
              <CloudDownload size={16} /> Sincronizar academia
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
