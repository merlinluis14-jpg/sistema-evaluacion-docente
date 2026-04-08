import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { isPrismaKnownRequestError } from "@/lib/prismaErrors";
import { getSessionRole } from "@/lib/sessionUser";
import { formatAcademicText } from "@/lib/text/academicText";

export const dynamic = "force-dynamic";

export default async function NuevaMateriaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [carreras, docentes] = await Promise.all([
    prisma.career.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.teacher.findMany({
      where: { isActive: true },
      orderBy: { lastName: "asc" },
      include: { career: true },
    }),
  ]);

  async function crearMateria(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || getSessionRole(session) !== "ADMIN") {
      redirect("/login");
    }

    const nombre = formatAcademicText(formData.get("name") as string);
    const codigo = (formData.get("code") as string)?.trim().toUpperCase();
    const cuatrimestre = parseInt(formData.get("cuatrimestre") as string, 10);
    const careerId = formData.get("careerId") as string;
    const teacherId = formData.get("teacherId") as string;

    if (!nombre || !codigo || !careerId || !teacherId || Number.isNaN(cuatrimestre)) {
      redirect("/admin/materias/nueva?error=campos");
    }

    try {
      const subject = await prisma.subject.create({
        data: {
          name: nombre,
          code: codigo,
          cuatrimestre,
          careerId,
          teacherId,
          isActive: true,
        },
      });

      await logAdminAction({
        action: "CREATE",
        entity: "MATERIA",
        entityId: subject.id,
        detail: `Materia creada: ${subject.name} (${subject.code})`,
      });
    } catch (error) {
      if (isPrismaKnownRequestError(error) && error.code === "P2002") {
        redirect("/admin/materias/nueva?error=duplicado");
      }
      redirect("/admin/materias/nueva?error=servidor");
    }

    redirect("/admin/materias?success=creada");
  }

  const mensajesError: Record<string, string> = {
    campos: "Completa todos los campos obligatorios.",
    duplicado: "Ya existe una materia con ese código en la carrera seleccionada.",
    servidor: "Error interno del servidor. Intenta de nuevo.",
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
          Nueva <span className="text-blue-600">Materia</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Registra una nueva asignatura en el catálogo del sistema
        </p>
      </div>

      {error && mensajesError[error] && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-600">{mensajesError[error]}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-slate-900 px-6 py-4">
          <p className="font-black text-white">Datos de la materia</p>
          <p className="mt-0.5 text-xs text-slate-400">
            El código debe ser único dentro de la carrera seleccionada
          </p>
        </div>

        <form action={crearMateria} className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Nombre de la materia <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="Ej: Base de Datos I"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              name="code"
              required
              placeholder="Ej: ISC-BD1"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              Se guardará en mayúsculas. Debe ser único dentro de la carrera.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Cuatrimestre <span className="text-red-500">*</span>
            </label>
            <select
              name="cuatrimestre"
              required
              defaultValue=""
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="" disabled>Selecciona el cuatrimestre</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((numero) => (
                <option key={numero} value={numero}>{numero}° Cuatrimestre</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Carrera <span className="text-red-500">*</span>
            </label>
            <select
              name="careerId"
              required
              defaultValue=""
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="" disabled>Selecciona una carrera</option>
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.code} - {carrera.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Docente asignado <span className="text-red-500">*</span>
            </label>
            <select
              name="teacherId"
              required
              defaultValue=""
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="" disabled>Selecciona un docente</option>
              {docentes.map((docente) => (
                <option key={docente.id} value={docente.id}>
                  {docente.name} {docente.lastName} - {docente.career.code}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 active:scale-[0.99]"
            >
              Crear materia
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
