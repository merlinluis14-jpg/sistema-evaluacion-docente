import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import {
  extractCuatrimestreFromGroupName,
  replaceGroupsForSubject,
  resolveManualGroupIdsForCareer,
  resyncGroupsForSubject,
} from "@/lib/groupAssignments";
import { prisma } from "@/lib/prisma";
import { isPrismaKnownRequestError } from "@/lib/prismaErrors";
import { getSessionRole } from "@/lib/sessionUser";
import { formatAcademicText } from "@/lib/text/academicText";
import { SubjectRelationsFields } from "../../SubjectRelationsFields";

export const dynamic = "force-dynamic";

export default async function EditarMateriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [subject, careers, teachers, groups] = await Promise.all([
    prisma.subject.findUnique({
      where: { id },
      include: {
        career: true,
        teacher: true,
        groups: {
          select: { groupId: true },
        },
      },
    }),
    prisma.career.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    prisma.teacher.findMany({
      where: { isActive: true },
      orderBy: { lastName: "asc" },
      include: { career: true },
    }),
    prisma.group.findMany({
      where: { isActive: true },
      orderBy: [{ career: { code: "asc" } }, { period: "asc" }, { name: "asc" }],
      include: { career: true },
    }),
  ]);

  if (!subject) {
    notFound();
  }

  const currentGroupIds = subject.groups.map((group) => group.groupId);
  const automaticGroupIds = groups
    .filter((group) => (
      group.careerId === subject.careerId
      && extractCuatrimestreFromGroupName(group.name) === subject.cuatrimestre
    ))
    .map((group) => group.id);

  const automaticGroupIdSet = new Set(automaticGroupIds);
  const initialAssignmentMode = (
    currentGroupIds.length === automaticGroupIds.length
    && currentGroupIds.every((groupId) => automaticGroupIdSet.has(groupId))
  ) ? "auto" : "manual";

  async function actualizarMateria(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || getSessionRole(session) !== "ADMIN") {
      redirect("/login");
    }

    const name = formatAcademicText(String(formData.get("name") ?? ""));
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    const cuatrimestre = parseInt(String(formData.get("cuatrimestre") ?? ""), 10);
    const careerId = String(formData.get("careerId") ?? "").trim();
    const teacherId = String(formData.get("teacherId") ?? "").trim();
    const assignmentMode = String(formData.get("assignmentMode") ?? "auto");
    const isActive = formData.get("isActive") === "true";
    const requestedGroupIds = formData
      .getAll("groupIds")
      .map((value) => String(value).trim())
      .filter(Boolean);

    if (!name || !code || !careerId || !teacherId || Number.isNaN(cuatrimestre)) {
      redirect(`/admin/materias/${id}/editar?error=campos`);
    }

    if (assignmentMode !== "auto" && assignmentMode !== "manual") {
      redirect(`/admin/materias/${id}/editar?error=asignacion`);
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        id: teacherId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!teacher) {
      redirect(`/admin/materias/${id}/editar?error=docente`);
    }

    if (assignmentMode === "manual" && requestedGroupIds.length === 0) {
      redirect(`/admin/materias/${id}/editar?error=grupos`);
    }

    const manualGroupIds = assignmentMode === "manual"
      ? await resolveManualGroupIdsForCareer(careerId, requestedGroupIds, cuatrimestre)
      : [];

    if (assignmentMode === "manual" && !manualGroupIds) {
      redirect(`/admin/materias/${id}/editar?error=grupos_carrera`);
    }

    try {
      const updatedSubject = await prisma.subject.update({
        where: { id },
        data: {
          name,
          code,
          cuatrimestre,
          careerId,
          teacherId,
          isActive,
        },
      });

      const linkedGroups = assignmentMode === "manual"
        ? await replaceGroupsForSubject(updatedSubject.id, manualGroupIds ?? [])
        : await resyncGroupsForSubject(updatedSubject.id, careerId, cuatrimestre);

      await logAdminAction({
        action: "UPDATE",
        entity: "MATERIA",
        entityId: updatedSubject.id,
        detail: assignmentMode === "manual"
          ? `Materia actualizada: ${updatedSubject.name} (${updatedSubject.code}). Grupos manuales: ${linkedGroups}.`
          : `Materia actualizada: ${updatedSubject.name} (${updatedSubject.code}). Grupos sincronizados automaticamente: ${linkedGroups}.`,
      });

      revalidatePath("/admin/materias");
    } catch (updateError) {
      if (isPrismaKnownRequestError(updateError) && updateError.code === "P2002") {
        redirect(`/admin/materias/${id}/editar?error=duplicado`);
      }

      redirect(`/admin/materias/${id}/editar?error=servidor`);
    }

    redirect("/admin/materias");
  }

  const mensajesError: Record<string, string> = {
    campos: "Completa todos los campos obligatorios.",
    duplicado: "Ya existe una materia con ese codigo en la carrera seleccionada.",
    docente: "Selecciona un docente activo para la materia.",
    grupos: "Si eliges asignacion manual, debes seleccionar al menos un grupo.",
    grupos_carrera: "Todos los grupos manuales deben pertenecer a la misma carrera y cuatrimestre de la materia.",
    asignacion: "Selecciona un modo de asignacion valido para los grupos.",
    servidor: "No fue posible guardar los cambios. Intenta de nuevo.",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <Link
        href="/admin/materias"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={15} /> Volver a Materias
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Editar <span className="text-blue-600">Materia</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Ajusta la carga academica de la asignatura y define si los grupos quedaran automaticos o manuales.
        </p>
      </div>

      {error && mensajesError[error] ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-600">{mensajesError[error]}</p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-slate-900 px-6 py-4">
          <p className="font-black text-white">{subject.name}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {subject.code} - {formatAcademicText(subject.career.name)}
          </p>
        </div>

        <form action={actualizarMateria} className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Nombre de la materia <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              defaultValue={subject.name}
              required
              placeholder="Ej: Base de Datos I"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Codigo <span className="text-red-500">*</span>
            </label>
            <input
              name="code"
              defaultValue={subject.code}
              required
              placeholder="Ej: ISC-BD1"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              Se guardara en mayusculas. Debe ser unico dentro de la carrera.
            </p>
          </div>

          <SubjectRelationsFields
            careers={careers.map((career) => ({
              id: career.id,
              code: career.code,
              name: formatAcademicText(career.name),
            }))}
            teachers={teachers.map((teacher) => ({
              id: teacher.id,
              name: teacher.name,
              lastName: teacher.lastName,
              careerId: teacher.careerId,
              careerCode: teacher.career.code,
            }))}
            groups={groups.map((group) => ({
              id: group.id,
              name: group.name,
              period: group.period,
              careerId: group.careerId,
              careerCode: group.career.code,
            }))}
            initialCuatrimestre={subject.cuatrimestre}
            initialCareerId={subject.careerId}
            initialTeacherId={subject.teacherId}
            initialAssignmentMode={initialAssignmentMode}
            initialGroupIds={currentGroupIds}
          />

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Estado
            </label>
            <select
              name="isActive"
              defaultValue={subject.isActive ? "true" : "false"}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Las materias inactivas no aparecen en el formulario de evaluacion.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 active:scale-[0.99]"
            >
              Guardar cambios
            </button>
            <Link
              href="/admin/materias"
              className="rounded-xl bg-slate-100 px-6 py-3 text-center text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
