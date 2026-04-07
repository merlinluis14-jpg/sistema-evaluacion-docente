import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/SignOutButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AlumnoLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session || (session.user as { role?: string }).role !== "ALUMNO") {
    redirect("/login");
  }

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { canChangeInitialPassword: true },
      })
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
                  <span className="text-sm font-black text-white">U</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black leading-none text-slate-800">UPTEX Eval</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Panel del Alumno
                  </p>
                </div>
              </div>

              <div className="sm:hidden">
                <SignOutButton className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                  Salir
                </SignOutButton>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:min-w-[420px] lg:justify-end">
              <nav className="flex flex-wrap items-center gap-2">
                <Link
                  href="/alumno"
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600"
                >
                  Mis Materias
                </Link>
                {user?.canChangeInitialPassword ? (
                  <Link
                    href="/alumno/cambiar-contrasena"
                    className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition-all hover:bg-amber-100 hover:text-amber-800"
                  >
                    Cambiar Contraseña
                  </Link>
                ) : null}
              </nav>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Alumno</p>
                </div>
                <SignOutButton className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                  Salir
                </SignOutButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>

      <footer className="mt-auto border-t border-slate-200/80 bg-white/90">
        <div className="mx-auto flex max-w-5xl items-start gap-3 px-4 py-4 sm:items-center sm:px-6 lg:px-8">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
            Seguro
          </span>
          <p className="text-xs leading-relaxed text-slate-500">
            Tu evaluación es <strong className="text-slate-700">completamente anónima</strong>. Los
            docentes no pueden identificarte.
          </p>
        </div>
      </footer>
    </div>
  );
}
