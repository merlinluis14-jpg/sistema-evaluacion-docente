"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
    { href: "/dashboard", label: "Inicio", icon: "🏠" },
    { href: "/dashboard/docentes", label: "Docentes", icon: "👨‍🏫" },
    { href: "/dashboard/materias", label: "Materias", icon: "📚" },
    { href: "/dashboard/periodos", label: "Periodos", icon: "📅" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-gradient-to-b from-blue-950 to-blue-900 text-white min-h-screen p-6 flex flex-col shadow-xl">
            {/* Logo / Título */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-lg">🎓</div>
                    <h2 className="text-lg font-black tracking-tight">UPT Eval</h2>
                </div>
                <p className="text-[11px] text-blue-300 font-medium pl-12">Sistema FDA-24.5</p>
            </div>

            {/* Navegación */}
            <nav className="space-y-1.5 flex-1">
                {navLinks.map(({ href, label, icon }) => {
                    // Activo si la ruta actual empieza con el href (excepto /dashboard exacto)
                    const isActive = href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(href);

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${isActive
                                ? "bg-white/15 text-white shadow-inner"
                                : "text-blue-200 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <span className="text-base">{icon}</span>
                            {label}
                            {isActive && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] text-blue-400 text-center font-medium leading-relaxed">
                    Tesina · UPT<br />Sistema de Evaluación Docente
                </p>
            </div>
        </aside>
    );
}
