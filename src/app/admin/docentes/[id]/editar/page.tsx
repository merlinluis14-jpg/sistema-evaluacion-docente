import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { prisma } from "@/lib/prisma";
import { isPrismaKnownRequestError } from "@/lib/prismaErrors";
import { getSessionRole } from "@/lib/sessionUser";

export const dynamic = "force-dynamic";

export default async function EditarDocentePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [teacher, careers] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        career: true,
      },
    }),
    prisma.career.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
  ]);

  if (!teacher) {
    notFound();
  }

  async function actualizarDocente(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || getSessionRole(session) !== "ADMIN") {
      redirect("/login");
    }

    const name = (formData.get("name") as string)?.trim();
    const lastName = (formData.get("lastName") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const employeeId = (formData.get("employeeId") as string)?.trim();
    const careerId = formData.get("careerId") as string;
    const position = (formData.get("position") as string)?.toUpperCase();
    const isActive = formData.get("isActive") === "true";

    if (!name || !lastName || !email || !employeeId || !careerId || !position) {
      redirect(`/admin/docentes/${id}/editar?error=campos`);
    }

    if (position !== "PA" && position !== "PTC") {
      redirect(`/admin/docentes/${id}/editar?error=tipo`);
    }

    try {
      const previousTeacher = await prisma.teacher.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!previousTeacher) {
        notFound();
      }

      await prisma.user.update({
        where: { id: previousTeacher.userId },
        data: {
          email,
          isActive,
        },
      });

      const updatedTeacher = await prisma.teacher.update({
        where: { id },
        data: {
          name,
          lastName,
          employeeId,
          careerId,
          position,
          isActive,
        },
      });

      await logAdminAction({
        action: previousTeacher.isActive !== isActive
          ? (isActive ? "ACTIVATE" : "DEACTIVATE")
          : "UPDATE",
        entity: "DOCENTE",
        entityId: updatedTeacher.id,
        detail: `Docente actualizado: ${updatedTeacher.name} ${updatedTeacher.lastName} (${updatedTeacher.employeeId})`,
      });

      revalidatePath("/admin/docentes");
      redirect("/admin/docentes?success=actualizado");
    } catch (updateError) {
      if (isPrismaKnownRequestError(updateError) && updateError.code === "P2002") {
        redirect(`/admin/docentes/${id}/editar?error=duplicado`);
      }

      redirect(`/admin/docentes/${id}/editar?error=servidor`);
    }
  }

  const mensajesError: Record<string, string> = {
    campos: "Completa todos los campos obligatorios.",
    tipo: "El tipo de docente debe ser PA o PTC.",
    duplicado: "Ya existe otro docente con ese email o número de empleado.",
    servidor: "No fue posible guardar los cambios. Intenta de nuevo.",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8 pb-20 sm:p-12">
      <Link
        href="/admin/docentes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={15} />
        Volver a Docentes
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Editar <span className="text-blue-600">Docente</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Actualiza datos institucionales sin perder historial de evaluaciones
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
            {teacher.name} {teacher.lastName}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {teacher.employeeId} - {teacher.user.email}
          </p>
        </div>

        <form action={actualizarDocente} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Nombre(s) <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                defaultValue={teacher.name}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                name="lastName"
                required
                defaultValue={teacher.lastName}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Correo institucional <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue={teacher.user.email ?? ""}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Número de empleado <span className="text-red-500">*</span>
              </label>
              <input
                name="employeeId"
                required
                defaultValue={teacher.employeeId}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Carrera <span className="text-red-500">*</span>
              </label>
              <select
                name="careerId"
                defaultValue={teacher.careerId}
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Tipo de docente <span className="text-red-500">*</span>
              </label>
              <select
                name="position"
                defaultValue={teacher.position}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="PA">PA - Profesor(a) de Asignatura</option>
                <option value="PTC">PTC - Profesor(a) de Tiempo Completo</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Estado
              </label>
              <select
                name="isActive"
                defaultValue={teacher.isActive ? "true" : "false"}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 active:scale-[0.99]"
            >
              Guardar cambios
            </button>
            <Link
              href="/admin/docentes"
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
