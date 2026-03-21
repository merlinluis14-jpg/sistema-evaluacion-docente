
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

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

    const nombre       = (formData.get("name") as string)?.trim();
    const codigo       = (formData.get("code") as string)?.trim().toUpperCase();
    const cuatrimestre = parseInt(formData.get("cuatrimestre") as string);
    const careerId     = formData.get("careerId") as string;
    const teacherId    = formData.get("teacherId") as string;

    if (!nombre || !codigo || !careerId || !teacherId || isNaN(cuatrimestre)) {
      redirect("/admin/materias/nueva?error=campos");
    }

    try {
      await prisma.subject.create({
        data: {
          name: nombre,
          code: codigo,
          cuatrimestre,
          careerId,
          teacherId,
          isActive: true,
        },
      });
    } catch (e: any) {
      if (e.code === "P2002") {
        redirect("/admin/materias/nueva?error=duplicado");
      }
      redirect("/admin/materias/nueva?error=servidor");
    }

    redirect("/admin/materias?success=creada");
  }

  const mensajesError: Record<string, string> = {
    campos:    "Completa todos los campos obligatorios.",
    duplicado: "Ya existe una materia con ese código en la carrera seleccionada.",
    servidor:  "Error interno del servidor. Intenta de nuevo.",
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">

      <Link
        href="/admin/materias"
        className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
      >
        ← Volver a Materias
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Nueva <span className="text-blue-600">Materia</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Registra una nueva asignatura en el catálogo del sistema
        </p>
      </div>

      {error && mensajesError[error] && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-red-500">⚠️</span>
          <p className="text-sm text-red-600 font-medium">{mensajesError[error]}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4">
          <p className="font-black text-white">Datos de la materia</p>
          <p className="text-slate-400 text-xs mt-0.5">
            El código debe ser único dentro de la carrera seleccionada
          </p>
        </div>

        <form action={crearMateria} className="p-6 space-y-5">

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Nombre de la materia <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="Ej: Base de Datos I"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              name="code"
              required
              placeholder="Ej: ISC-BD1"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
            <p className="text-xs text-slate-400 mt-1">
              Se guardará en mayúsculas. Debe ser único dentro de la carrera.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Cuatrimestre <span className="text-red-500">*</span>
            </label>
            <select
              name="cuatrimestre"
              required
              defaultValue=""
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="" disabled>Selecciona el cuatrimestre</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <option key={n} value={n}>{n}° Cuatrimestre</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Carrera <span className="text-red-500">*</span>
            </label>
            <select
              name="careerId"
              required
              defaultValue=""
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="" disabled>Selecciona una carrera</option>
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Docente asignado <span className="text-red-500">*</span>
            </label>
            <select
              name="teacherId"
              required
              defaultValue=""
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="" disabled>Selecciona un docente</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.lastName} — {d.career.code}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 active:scale-[0.99] transition-all shadow-lg shadow-blue-500/20"
            >
              Crear materia
            </button>
            <Link
              href="/admin/materias"
              className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all text-center"
            >
              Cancelar
            </Link>
          </div>

        </form>
      </div>

    </div>
  );
}
