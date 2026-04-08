import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import bcrypt from "bcryptjs";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { isPrismaKnownRequestError } from "@/lib/prismaErrors";
import { getSessionRole } from "@/lib/sessionUser";

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
    if (!session || getSessionRole(session) !== "ADMIN") {
      redirect("/login");
    }

    const matricula = (formData.get("matricula") as string)?.trim();
    const nombre = (formData.get("nombre") as string)?.trim();
    const apellido = (formData.get("apellido") as string)?.trim();
    const email = (formData.get("email") as string)?.trim() || null;
    const careerId = formData.get("careerId") as string;
    const groupId = (formData.get("groupId") as string) || null;
    const password = (formData.get("password") as string)?.trim() || matricula;

    if (!matricula || !nombre || !apellido || !careerId) {
      redirect("/admin/alumnos/nuevo?error=campos");
    }

    const capitalizar = (str: string) =>
      str.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

    const nombreFormateado = capitalizar(nombre);
    const apellidoFormateado = capitalizar(apellido);

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username: matricula,
          email,
          password: hashedPassword,
          role: "ALUMNO",
          canChangeInitialPassword: true,
          student: {
            create: {
              matricula,
              name: nombreFormateado,
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

      await logAdminAction({
        action: "CREATE",
        entity: "ALUMNO",
        entityId: user.student?.id,
        detail: `Alumno creado: ${nombreFormateado} ${apellidoFormateado} (${matricula})`,
      });
    } catch (error) {
      if (isPrismaKnownRequestError(error) && error.code === "P2002") {
        redirect("/admin/alumnos/nuevo?error=duplicado");
      }
      redirect("/admin/alumnos/nuevo?error=servidor");
    }

    redirect("/admin/alumnos?success=creado");
  }

  const mensajesError: Record<string, string> = {
    campos: "Completa todos los campos obligatorios.",
    duplicado: "Ya existe un alumno con esa matrícula o email.",
    servidor: "Error interno del servidor. Intenta de nuevo.",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <Link
        href="/admin/alumnos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={15} /> Volver a Alumnos
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Nuevo <span className="text-blue-600">Alumno</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Registro individual | para carga masiva usa Importar CSV
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
          <p className="font-black text-white">Datos del alumno</p>
          <p className="mt-0.5 text-xs text-slate-400">
            La contraseña inicial será temporal y el alumno podrá cambiarla una sola vez desde su panel
          </p>
        </div>

        <form action={crearAlumno} className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Matricula <span className="text-red-500">*</span>
            </label>
            <input
              name="matricula"
              required
              placeholder="Ej: 220310001"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              Se usara como nombre de usuario para el login.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Nombre(s) <span className="text-red-500">*</span>
              </label>
              <input
                name="nombre"
                required
                placeholder="Ej: Juan"
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
                placeholder="Ej: Perez Garcia"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Email institucional
              <span className="ml-1 font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              name="email"
              type="email"
              placeholder="Ej: j.perez@uptx.edu.mx"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Carrera <span className="text-red-500">*</span>
            </label>
            <select
              name="careerId"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Selecciona una carrera</option>
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.code} - {carrera.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Grupo
              <span className="ml-1 font-normal text-slate-400">(opcional)</span>
            </label>
            <select
              name="groupId"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Sin grupo asignado</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.career.code} - {grupo.name} ({grupo.period})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Contraseña inicial
              <span className="ml-1 font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              name="password"
              type="password"
              placeholder="Dejar vacío para usar la matrícula"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              Esta contraseña queda como temporal hasta que el alumno la cambie por única vez.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 active:scale-[0.99]"
            >
              Registrar alumno
            </button>
            <Link
              href="/admin/alumnos"
              className="px-6 py-3 text-center text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 rounded-xl bg-slate-100"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
