// Edición de Materia - Panel Administrador

import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3, CheckCircle2, AlertTriangle } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function EditarMateriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [materia, carreras, docentes] = await Promise.all([
    prisma.subject.findUnique({
      where: { id },
      include: { career: true, teacher: true },
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
  ]);

  if (!materia) notFound();

  // Server Action para actualizar la materia
  async function actualizarMateria(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      redirect('/login');
    }

    const nombre = formData.get("name") as string;
    const codigo = formData.get("code") as string;
    const cuatrimestre = parseInt(formData.get("cuatrimestre") as string);
    const careerId = formData.get("careerId") as string;
    const teacherId = formData.get("teacherId") as string;
    const isActive = formData.get("isActive") === "true";

    if (!nombre || !codigo || !careerId || !teacherId || isNaN(cuatrimestre)) {
      redirect(`/admin/materias/${id}/editar?error=campos`);
    }

    try {
      const updatedSubject = await prisma.subject.update({
        where: { id },
        data: {
          name: nombre.trim(),
          code: codigo.trim().toUpperCase(),
          cuatrimestre,
          careerId,
          teacherId,
          isActive,
        },
      });

      await logAdminAction({
        action: "UPDATE",
        entity: "MATERIA",
        entityId: updatedSubject.id,
        detail: `Materia actualizada: ${updatedSubject.name} (${updatedSubject.code})`,
      });

      revalidatePath("/admin/materias");
      redirect("/admin/materias");

    } catch (e: any) {
      // Código duplicado en la misma carrera (P2002)
      if (e.code === "P2002") {
        redirect(`/admin/materias/${id}/editar?error=duplicado`);
      }
      redirect(`/admin/materias/${id}/editar?error=servidor`);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">

      {/* Navegación */}
      <Link
        href="/admin/materias"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
      >
        <ArrowLeft size={15} /> Volver a Materias
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Editar <span className="text-blue-600">Materia</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Modifica los datos de la asignatura seleccionada
        </p>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4">
          <p className="font-black text-white">{materia.name}</p>
          <p className="text-slate-400 text-xs mt-0.5">
            {materia.code} · {materia.career.name}
          </p>
        </div>

        <form action={actualizarMateria} className="p-6 space-y-5">

          {/* Nombre */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Nombre de la materia <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              defaultValue={materia.name}
              required
              placeholder="Ej: Base de Datos I"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>

          {/* Código */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              name="code"
              defaultValue={materia.code}
              required
              placeholder="Ej: ISC-BD1"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
            <p className="text-xs text-slate-400 mt-1">
              Se guardará en mayúsculas. Debe ser único dentro de la carrera.
            </p>
          </div>

          {/* Cuatrimestre */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Cuatrimestre <span className="text-red-500">*</span>
            </label>
            <select
              name="cuatrimestre"
              defaultValue={materia.cuatrimestre}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <option key={n} value={n}>
                  {n}° Cuatrimestre
                </option>
              ))}
            </select>
          </div>

          {/* Carrera */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Carrera <span className="text-red-500">*</span>
            </label>
            <select
              name="careerId"
              defaultValue={materia.careerId}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Docente */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Docente asignado <span className="text-red-500">*</span>
            </label>
            <select
              name="teacherId"
              defaultValue={materia.teacherId}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.lastName} — {d.career.code}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Estado
            </label>
            <select
              name="isActive"
              defaultValue={materia.isActive ? "true" : "false"}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Las materias inactivas no aparecen en el formulario de evaluación.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-blue-700 text-white text-sm font-black hover:bg-blue-800 active:scale-[0.99] transition-all shadow-lg shadow-blue-700/20"
            >
              Guardar cambios
            </button>
            <Link
              href="/admin/materias"
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-all text-center"
            >
              Cancelar
            </Link>
          </div>

        </form>
      </div>

    </div>
  );
}
