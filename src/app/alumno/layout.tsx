import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { SignOutButton } from "@/components/SignOutButton";
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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <span className="text-xs font-black text-white">U</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-none text-slate-800">UPTEX Eval</p>
                  <p className="text-[10px] text-slate-400">Evaluacion Docente</p>
                </div>
              </div>

              <div className="sm:hidden">
                <SignOutButton className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                  Salir
                </SignOutButton>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <nav className="flex items-center gap-1">
                <Link
                  href="/alumno"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600"
                >
                  Mis Materias
                </Link>
                {user?.canChangeInitialPassword ? (
                  <Link
                    href="/alumno/cambiar-contrasena"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-amber-700 transition-all hover:bg-amber-50 hover:text-amber-800"
                  >
                    Cambiar Contraseña
                  </Link>
                ) : null}
              </nav>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="hidden text-right md:block">
                  <p className="text-xs font-bold text-slate-700">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-[10px] text-slate-400">Alumno</p>
                </div>
                <SignOutButton className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                  Salir
                </SignOutButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex-1 w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
        {children}
      </main>

      <footer className="mt-auto border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-start gap-2 px-4 py-3 sm:items-center sm:px-6">
          <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wide text-blue-500">
            Seguro
          </span>
          <p className="text-xs leading-relaxed text-slate-400">
            Tu evaluacion es <strong className="text-slate-600">completamente anonima</strong>.
            Los docentes no pueden identificarte.
          </p>
        </div>
      </footer>
    </div>
  );
}
