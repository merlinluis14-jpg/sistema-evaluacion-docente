
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import bcrypt from "bcryptjs";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NuevoAlumnoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [carreras, grupos] = await Promise.all([
    prisma.career.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.group.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { career: true },
    }),
  ]);

  async function crearAlumno(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      redirect('/login');
    }

    const matricula    = (formData.get("matricula") as string)?.trim();
    const nombre       = (formData.get("nombre") as string)?.trim();
    const apellido     = (formData.get("apellido") as string)?.trim();
    const email        = (formData.get("email") as string)?.trim() || null;
    const careerId     = formData.get("careerId") as string;
    const groupId      = formData.get("groupId") as string || null;
    const password     = (formData.get("password") as string)?.trim() || matricula;

    if (!matricula || !nombre || !apellido || !careerId) {
      redirect("/admin/alumnos/nuevo?error=campos");
    }

    const capitalizar = (str: string) =>
      str.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

    const nombreFormateado   = capitalizar(nombre);
    const apellidoFormateado = capitalizar(apellido);

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username: matricula,
          email:    email || null,
          password: hashedPassword,
          role:     "ALUMNO",
          student: {
            create: {
              matricula,
              name:     nombreFormateado,
              lastName: apellidoFormateado,
              careerId,
            },
          },
        },
        include: { student: true },
      });

      if (groupId && user.student) {
        await prisma.groupEnrollment.create({
          data: {
            studentId: user.student.id,
            groupId,
          },
        });
      }
    } catch (e: any) {
      if (e.code === "P2002") {
        redirect("/admin/alumnos/nuevo?error=duplicado");
      }
      redirect("/admin/alumnos/nuevo?error=servidor");
    }

    redirect("/admin/alumnos?success=creado");
  }

  const mensajesError: Record<string, string> = {
    campos:    "Completa todos los campos obligatorios.",
    duplicado: "Ya existe un alumno con esa matrícula o email.",
    servidor:  "Error interno del servidor. Intenta de nuevo.",
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">

      <Link
        href="/admin/alumnos"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
      >
        <ArrowLeft size={15} /> Volver a Alumnos
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Nuevo <span className="text-blue-600">Alumno</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Registro individual — para carga masiva usa Importar CSV
        </p>
      </div>

      {error && mensajesError[error] && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 font-medium">{mensajesError[error]}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4">
          <p className="font-black text-white">Datos del alumno</p>
          <p className="text-slate-400 text-xs mt-0.5">
            La contraseña inicial será la matrícula si no se especifica
          </p>
        </div>

        <form action={crearAlumno} className="p-6 space-y-5">

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Matrícula <span className="text-red-500">*</span>
            </label>
            <input
              name="matricula"
              required
              placeholder="Ej: 220310001"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
            <p className="text-xs text-slate-400 mt-1">
              Se usará como nombre de usuario para el login.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Nombre(s) <span className="text-red-500">*</span>
              </label>
              <input
                name="nombre"
                required
                placeholder="Ej: Juan"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Apellido(s) <span className="text-red-500">*</span>
              </label>
              <input
                name="apellido"
                required
                placeholder="Ej: Pérez García"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Email institucional
              <span className="text-slate-400 font-normal ml-1">(opcional)</span>
            </label>
            <input
              name="email"
              type="email"
              placeholder="Ej: j.perez@uptx.edu.mx"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Carrera <span className="text-red-500">*</span>
            </label>
            <select
              name="careerId"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Selecciona una carrera</option>
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Grupo
              <span className="text-slate-400 font-normal ml-1">(opcional)</span>
            </label>
            <select
              name="groupId"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Sin grupo asignado</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.career.code} — {g.name} ({g.period})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Contraseña inicial
              <span className="text-slate-400 font-normal ml-1">(opcional)</span>
            </label>
            <input
              name="password"
              type="password"
              placeholder="Dejar vacío para usar la matrícula"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-blue-700 text-white text-sm font-black hover:bg-blue-800 active:scale-[0.99] transition-all shadow-lg shadow-blue-700/20"
            >
              Registrar alumno
            </button>
            <Link
              href="/admin/alumnos"
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
