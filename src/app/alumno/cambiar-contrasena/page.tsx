import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft, KeyRound } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId } from "@/lib/sessionUser";

export const dynamic = "force-dynamic";

export default async function CambiarContrasenaAlumnoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session || getSessionRole(session) !== "ALUMNO") {
    redirect("/login");
  }

  const userId = getSessionUserId(session);
  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true },
  });

  if (!user || user.role !== "ALUMNO" || !user.isActive) {
    redirect("/login");
  }

  if (!user.canChangeInitialPassword) {
    redirect("/alumno?info=password-bloqueada");
  }

  async function cambiarContrasena(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || getSessionRole(session) !== "ALUMNO") {
      redirect("/login");
    }

    const userId = getSessionUserId(session);
    if (!userId) {
      redirect("/login");
    }

    const currentPassword = String(formData.get("currentPassword") ?? "").trim();
    const newPassword = String(formData.get("newPassword") ?? "").trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      redirect("/alumno/cambiar-contrasena?error=campos");
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        role: true,
        isActive: true,
        canChangeInitialPassword: true,
      },
    });

    if (
      !currentUser ||
      currentUser.role !== "ALUMNO" ||
      !currentUser.isActive ||
      !currentUser.canChangeInitialPassword
    ) {
      redirect("/alumno?info=password-bloqueada");
    }

    const passwordMatches = await bcrypt.compare(currentPassword, currentUser.password);
    if (!passwordMatches) {
      redirect("/alumno/cambiar-contrasena?error=actual");
    }

    if (newPassword.length < 8) {
      redirect("/alumno/cambiar-contrasena?error=longitud");
    }

    if (newPassword !== confirmPassword) {
      redirect("/alumno/cambiar-contrasena?error=confirmacion");
    }

    if (newPassword === currentPassword) {
      redirect("/alumno/cambiar-contrasena?error=igual");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        password: hashedPassword,
        canChangeInitialPassword: false,
      },
    });

    revalidatePath("/alumno");
    revalidatePath("/alumno/cambiar-contrasena");

    redirect("/alumno?success=password-actualizada");
  }

  const mensajesError: Record<string, string> = {
    campos: "Completa todos los campos obligatorios.",
    actual: "La contrasena temporal actual no es correcta.",
    longitud: "La nueva contrasena debe tener al menos 8 caracteres.",
    confirmacion: "La confirmacion no coincide con la nueva contrasena.",
    igual: "La nueva contrasena debe ser diferente a la temporal.",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/alumno"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={15} />
        Volver a Mis Materias
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Cambiar <span className="text-blue-600">Contrasena Inicial</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {user.student
            ? `${user.student.name}, esta opcion esta disponible una sola vez mientras tu contrasena siga siendo temporal.`
            : "Esta opcion esta disponible una sola vez mientras tu contrasena siga siendo temporal."}
        </p>
      </div>

      {error && mensajesError[error] ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-600">{mensajesError[error]}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-blue-700">
          <KeyRound className="h-4 w-4" />
          Cambio personal unico
        </p>
        <p className="mt-2 text-sm text-blue-600">
          Despues de guardar una nueva contrasena, ya no podras modificarla desde tu panel.
          Si la olvidas en el futuro, deberas solicitar al administrador que la restablezca.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-slate-900 px-6 py-4">
          <p className="font-black text-white">Actualiza tu acceso</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Conserva esta nueva contrasena en un lugar seguro
          </p>
        </div>

        <form action={cambiarContrasena} className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Contrasena temporal actual <span className="text-red-500">*</span>
            </label>
            <input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Nueva contrasena <span className="text-red-500">*</span>
              </label>
              <input
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Confirmar contrasena <span className="text-red-500">*</span>
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 active:scale-[0.99]"
            >
              Guardar nueva contrasena
            </button>
            <Link
              href="/alumno"
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
