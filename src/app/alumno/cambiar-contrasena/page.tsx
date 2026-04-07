import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft, KeyRound, LockKeyhole } from "lucide-react";

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
    actual: "La contraseña temporal actual no es correcta.",
    longitud: "La nueva contraseña debe tener al menos 8 caracteres.",
    confirmacion: "La confirmación no coincide con la nueva contraseña.",
    igual: "La nueva contraseña debe ser diferente a la temporal.",
  };

  return (
    <div className="relative mx-auto max-w-3xl space-y-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 rounded-[2rem] bg-gradient-to-b from-amber-50/70 via-slate-50 to-transparent blur-2xl" />

      <Link
        href="/alumno"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={15} />
        Volver a Mis Materias
      </Link>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-amber-100/60 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              <LockKeyhole className="h-3.5 w-3.5 text-amber-600" />
              Seguridad de Acceso
            </div>
            <h1 className="mt-4 text-3xl font-black text-slate-800">
              Cambiar <span className="text-blue-600">Contraseña Inicial</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {user.student
                ? `${user.student.name}, esta opción está disponible una sola vez mientras tu contraseña siga siendo temporal.`
                : "Esta opción está disponible una sola vez mientras tu contraseña siga siendo temporal."}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">
              Cambio Único
            </p>
            <p className="mt-2 text-sm font-semibold text-amber-900">
              Después de guardar, solo el admin podrá restablecerla.
            </p>
          </div>
        </div>
      </section>

      {error && mensajesError[error] ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-600">{mensajesError[error]}</p>
        </div>
      ) : null}

      <section className="rounded-3xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-700">
          <KeyRound className="h-4 w-4" />
          Cambio personal único
        </p>
        <p className="mt-2 text-sm text-amber-700">
          Después de guardar una nueva contraseña, ya no podrás modificarla desde tu panel. Si la
          olvidas en el futuro, deberás solicitar al administrador que la restablezca.
        </p>
      </section>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.18)]">
        <div className="border-b border-slate-100 bg-slate-900 px-6 py-5">
          <p className="font-black text-white">Actualiza tu acceso</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Conserva esta nueva contraseña en un lugar seguro.
          </p>
        </div>

        <form action={cambiarContrasena} className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Contraseña temporal actual <span className="text-red-500">*</span>
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
                Nueva contraseña <span className="text-red-500">*</span>
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
                Confirmar contraseña <span className="text-red-500">*</span>
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
              Guardar nueva contraseña
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
