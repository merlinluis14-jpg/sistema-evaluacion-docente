// src/app/admin/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
        redirect("/login");
    }

    const navItems = [
        { href: "/admin", icon: "⊞", label: "Dashboard" },
        { href: "/admin/docentes", icon: "👨🏫", label: "Docentes" },
        { href: "/admin/alumnos", icon: "🎓", label: "Alumnos" },
        { href: "/admin/carreras", icon: "🏛️", label: "Carreras" },
        { href: "/admin/grupos", icon: "👥", label: "Grupos" },
        { href: "/admin/materias", icon: "📚", label: "Materias" },
        { href: "/admin/periodos", icon: "📅", label: "Periodos" },
        { href: "/admin/reportes", icon: "📊", label: "Reportes" },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className="w-60 bg-[#0F1729] flex flex-col flex-shrink-0 h-full">

                {/* Logo */}
                <div className="px-5 py-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-black text-sm">U</span>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm leading-none">UPT Eval</p>
                            <p className="text-blue-400 text-[10px] mt-0.5">Panel Administrador</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium group"
                        >
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

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

            {/* ── Contenido principal ── */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>

        </div>
    );
}
