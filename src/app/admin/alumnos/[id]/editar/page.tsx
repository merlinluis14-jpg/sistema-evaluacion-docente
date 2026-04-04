import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import {
  clearStudentEnrollmentForPeriod,
  replaceStudentEnrollmentForGroup,
} from "@/lib/catalogSync";
import { prisma } from "@/lib/prisma";
import { isPrismaKnownRequestError } from "@/lib/prismaErrors";
import { getSessionRole } from "@/lib/sessionUser";

export const dynamic = "force-dynamic";

export default async function EditarAlumnoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [student, careers, groups, activePeriod] = await Promise.all([
    prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        groups: {
          include: { group: { include: { career: true } } },
        },
        career: true,
      },
    }),
    prisma.career.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    prisma.group.findMany({
      where: { isActive: true },
      include: { career: true },
      orderBy: [{ period: "desc" }, { name: "asc" }],
    }),
    prisma.period.findFirst({
      where: { isActive: true },
      select: { name: true },
    }),
  ]);

  if (!student) {
    notFound();
  }

  const currentGroupId = student.groups[0]?.groupId ?? "";

  async function actualizarAlumno(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || getSessionRole(session) !== "ADMIN") {
      redirect("/login");
    }

    const matricula = (formData.get("matricula") as string)?.trim();
    const nombre = (formData.get("nombre") as string)?.trim();
    const apellido = (formData.get("apellido") as string)?.trim();
    const email = ((formData.get("email") as string) || "").trim().toLowerCase() || null;
    const careerId = formData.get("careerId") as string;
    const groupId = ((formData.get("groupId") as string) || "").trim() || null;
    const password = ((formData.get("password") as string) || "").trim();
    const isActive = formData.get("isActive") === "true";

    if (!matricula || !nombre || !apellido || !careerId) {
      redirect(`/admin/alumnos/${id}/editar?error=campos`);
    }

    try {
      const previousStudent = await prisma.student.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!previousStudent) {
        notFound();
      }

      await prisma.user.update({
        where: { id: previousStudent.userId },
        data: {
          username: matricula,
          email,
          isActive,
          ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
        },
      });

      const updatedStudent = await prisma.student.update({
        where: { id },
        data: {
          matricula,
          name: nombre,
          lastName: apellido,
          careerId,
          isActive,
        },
      });

      if (groupId) {
        await replaceStudentEnrollmentForGroup(updatedStudent.id, groupId);
      } else if (activePeriod?.name) {
        await clearStudentEnrollmentForPeriod(updatedStudent.id, activePeriod.name);
      }

      await logAdminAction({
        action: previousStudent.isActive !== isActive
          ? (isActive ? "ACTIVATE" : "DEACTIVATE")
          : "UPDATE",
        entity: "ALUMNO",
        entityId: updatedStudent.id,
        detail: `Alumno actualizado: ${updatedStudent.name} ${updatedStudent.lastName} (${updatedStudent.matricula})`,
      });

      revalidatePath("/admin/alumnos");
      redirect("/admin/alumnos?success=actualizado");
    } catch (updateError) {
      if (isPrismaKnownRequestError(updateError) && updateError.code === "P2002") {
        redirect(`/admin/alumnos/${id}/editar?error=duplicado`);
      }

      redirect(`/admin/alumnos/${id}/editar?error=servidor`);
    }
  }

  const mensajesError: Record<string, string> = {
    campos: "Completa todos los campos obligatorios.",
    duplicado: "Ya existe otro alumno con esa matricula, usuario o email.",
    servidor: "No fue posible guardar los cambios. Intenta de nuevo.",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8 pb-20 sm:p-12">
      <Link
        href="/admin/alumnos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={15} />
        Volver a Alumnos
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Editar <span className="text-blue-600">Alumno</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Actualiza datos y asignacion del periodo actual sin borrar historial
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
          <p className="font-black text-white">
            {student.name} {student.lastName}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {student.matricula} - {student.career.code}
          </p>
        </div>

        <form action={actualizarAlumno} className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Matricula <span className="text-red-500">*</span>
            </label>
            <input
              name="matricula"
              required
              defaultValue={student.matricula}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Nombre(s) <span className="text-red-500">*</span>
              </label>
              <input
                name="nombre"
                required
                defaultValue={student.name}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Apellido(s) <span className="text-red-500">*</span>
              </label>
              <input
                name="apellido"
                required
                defaultValue={student.lastName}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Email institucional
            </label>
            <input
              name="email"
              type="email"
              defaultValue={student.user.email ?? ""}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Carrera <span className="text-red-500">*</span>
              </label>
              <select
                name="careerId"
                defaultValue={student.careerId}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {careers.map((career) => (
                  <option key={career.id} value={career.id}>
                    {career.code} - {career.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Estado
              </label>
              <select
                name="isActive"
                defaultValue={student.isActive ? "true" : "false"}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Grupo del periodo actual
            </label>
            <select
              name="groupId"
              defaultValue={currentGroupId}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Sin grupo asignado</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.career.code} - {group.name} ({group.period})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Si eliges un grupo, reemplaza la asignacion del mismo periodo. Si lo dejas vacio y hay un periodo activo, se limpia esa asignacion.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Nueva contrasena
              <span className="ml-1 font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              name="password"
              type="password"
              placeholder="Dejar vacio para conservar la actual"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 active:scale-[0.99]"
            >
              Guardar cambios
            </button>
            <Link
              href="/admin/alumnos"
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
