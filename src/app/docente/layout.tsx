// src/app/docente/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";

export default async function DocenteLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as { role?: string }).role !== "DOCENTE") {
        redirect("/login");
    }

    const navItems = [
        { href: "/docente", icon: "⊞", label: "Resumen" },
        { href: "/docente/resultados", icon: "📊", label: "Mis Resultados" },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">

            {/* ── Sidebar verde ── */}
            <aside className="w-56 bg-[#0F2A1A] flex flex-col flex-shrink-0 h-full">

                {/* Logo */}
                <div className="px-5 py-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-black text-sm">U</span>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm leading-none">UPT Eval</p>
                            <p className="text-emerald-400 text-[10px] mt-0.5">Portal Docente</p>
                        </div>
                    </div>
                </div>

                {/* Nombre */}
                <div className="px-5 py-3 border-b border-white/10">
                    <p className="text-white text-xs font-bold truncate">
                        {session.user.name || session.user.email}
                    </p>
                    <p className="text-emerald-400 text-[10px] mt-0.5">Solo lectura</p>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                        >
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Nota privacidad */}
                <div className="px-4 py-3 mx-3 mb-3 bg-white/5 rounded-xl">
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                        🔒 Los resultados son anónimos. No puedes identificar a los alumnos que te evaluaron.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-white/10 space-y-2">
                    <p className="text-slate-500 text-[10px] truncate">{session.user.email}</p>
                    <Link
                        href="/api/auth/signout"
                        className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-xs font-medium"
                    >
                        <span>⏻</span> Cerrar sesión
                    </Link>
                </div>
            </aside>

            {/* ── Contenido ── */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>

        </div>
    );
}
