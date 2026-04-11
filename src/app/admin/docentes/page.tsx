import Link from "next/link";
import {
  BookOpen,
  CloudDownload,
  FilterX,
  Layers3,
  Pencil,
  UserCog,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatAcademicText } from "@/lib/text/academicText";
import { DeleteTeacherButton } from "./DeleteTeacherButton";
import { ResetPasswordButton } from "./ResetPasswordButton";

export const dynamic = "force-dynamic";

export default async function DocentesPage({
  searchParams,
}: {
  searchParams: Promise<{ career?: string; success?: string }>;
}) {
  const { career: careerId, success } = await searchParams;

  const teachers = await prisma.teacher.findMany({
    where: careerId ? { careerId } : undefined,
    orderBy: [{ lastName: "asc" }, { name: "asc" }],
    include: {
      career: true,
      user: { select: { email: true } },
      groupSubjects: {
        include: {
          group: true,
          subject: true,
        },
      },
    },
  });

  const activeCareer = careerId
    ? await prisma.career.findUnique({
        where: { id: careerId },
        select: { name: true, code: true },
      })
    : null;

  const teacherRows = teachers.map((teacher) => {
    const groupMap = new Map<string, { id: string; name: string; period: string }>();
    const subjectMap = new Map<string, { id: string; code: string; name: string }>();

    for (const assignment of teacher.groupSubjects) {
      if (assignment.group.isActive) {
        groupMap.set(assignment.group.id, {
          id: assignment.group.id,
          name: assignment.group.name,
          period: assignment.group.period,
        });
      }

      if (assignment.subject.isActive) {
        subjectMap.set(assignment.subject.id, {
          id: assignment.subject.id,
          code: assignment.subject.code,
          name: assignment.subject.name,
        });
      }
    }

    return {
      ...teacher,
      activeSubjects: Array.from(subjectMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "es"),
      ),
      assignedGroups: Array.from(groupMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "es"),
      ),
    };
  });

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in zoom-in p-4 pb-20 duration-500 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Gestion de <span className="text-blue-600">Docentes</span>
          </h1>
          <p className="mt-2 text-gray-500">
            Catalogo docente sincronizado desde el sistema de horarios.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link
            href="/admin/docentes/sincronizar"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100 sm:w-auto"
          >
            <CloudDownload size={16} />
            Sincronizar academia
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800 shadow-sm">
        Los docentes ya no deben capturarse ni importarse manualmente aqui. Las
        altas, bajas y cambios academicos se hacen en Horarios y despues se
        reflejan con <strong>Sincronizar academia</strong>.
      </div>

      {activeCareer && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-medium text-blue-800">
          <FilterX size={16} className="shrink-0 text-blue-500" />
          <span>
            Mostrando docentes de la carrera:{" "}
            <strong>
              {activeCareer.code} - {formatAcademicText(activeCareer.name)}
            </strong>
          </span>
          <Link
            href="/admin/docentes"
            className="ml-auto whitespace-nowrap font-bold text-blue-600 underline underline-offset-2 hover:text-blue-800"
          >
            Ver todos
          </Link>
        </div>
      )}

      {success === "actualizado" && (
        <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
          El docente se actualizo correctamente.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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
                  <td colSpan={7} className="py-16 text-center font-medium text-gray-400">
                    <UserCog className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                    No hay docentes sincronizados aun.{" "}
                    <Link
                      href="/admin/docentes/sincronizar"
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Ejecuta la sincronizacion academica
                    </Link>
                  </td>
                </tr>
              )}

              {teacherRows.map((teacher) => (
                <tr key={teacher.id} className="group transition-colors hover:bg-gray-50/50">
                  <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm">
                    <div className="flex items-center">
                      <div className="h-10 w-10 shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-xs font-bold text-white shadow-inner">
                          {teacher.name.charAt(0)}
                          {teacher.lastName.charAt(0)}
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
                    <div className="text-xs text-gray-700">{teacher.user.email ?? "-"}</div>
                    <div className="mt-0.5 font-mono text-xs text-gray-400">
                      {teacher.employeeId}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                      {teacher.career.code}
                    </span>
                    <div className="mt-1 max-w-[160px] truncate text-xs text-gray-400">
                      {formatAcademicText(teacher.career.name)}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${
                        teacher.position === "PTC"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-sky-200 bg-sky-50 text-sky-700"
                      }`}
                    >
                      {teacher.position}
                    </span>
                    <div className="mt-1 text-xs text-gray-400">
                      {teacher.position === "PTC" ? "Tiempo completo" : "Asignatura"}
                    </div>
                  </td>

                  <td className="px-3 py-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                          <BookOpen size={12} />
                          {teacher.activeSubjects.length} materias
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                          <Layers3 size={12} />
                          {teacher.assignedGroups.length} grupos
                        </span>
                      </div>

                      <div className="flex max-w-[260px] flex-wrap gap-1.5">
                        {teacher.assignedGroups.length > 0 ? (
                          teacher.assignedGroups.slice(0, 4).map((group) => (
                            <span
                              key={group.id}
                              className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
                              title={group.period}
                            >
                              {group.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">
                            Sin grupos enlazados
                          </span>
                        )}

                        {teacher.assignedGroups.length > 4 && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
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
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          teacher.isActive ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      {teacher.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/docentes/${teacher.id}/editar`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil size={13} />
                        Editar
                      </Link>
                      <ResetPasswordButton
                        teacherId={teacher.id}
                        teacherName={`${teacher.name} ${teacher.lastName}`}
                        teacherEmail={teacher.user.email ?? ""}
                      />
                      <DeleteTeacherButton
                        teacherId={teacher.id}
                        teacherName={`${teacher.name} ${teacher.lastName}`}
                      />
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
