// src/app/alumno/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";

export default async function AlumnoLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as { role?: string }).role !== "ALUMNO") {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            {/* ── Header top bar ── */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">

                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-black text-xs">U</span>
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm leading-none">UPT Eval</p>
                            <p className="text-slate-400 text-[10px]">Evaluación Docente</p>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex items-center gap-1">
                        <Link
                            href="/alumno"
                            className="px-3 py-1.5 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
                        >
                            Mis Materias
                        </Link>
                    </nav>

                    {/* Usuario + logout */}
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-slate-700">{session.user.name || session.user.email}</p>
                            <p className="text-[10px] text-slate-400">Alumno</p>
                        </div>
                        <Link
                            href="/api/auth/signout"
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-red-50"
                        >
                            Salir
                        </Link>
                    </div>

                </div>
            </header>

            {/* ── Contenido ── */}
            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
                {children}
            </main>

            {/* ── Footer con nota de anonimato ── */}
            <footer className="border-t border-gray-100 bg-white mt-auto">
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-2">
                    <span className="text-blue-500 text-sm">🔒</span>
                    <p className="text-xs text-slate-400">
                        Tu evaluación es <strong className="text-slate-600">completamente anónima</strong>. Los docentes no pueden identificarte.
                    </p>
                </div>
            </footer>

        </div>
    );
}
