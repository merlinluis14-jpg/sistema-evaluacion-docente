"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BookOpen,
    CalendarDays,
    GraduationCap,
    House,
    School,
} from "lucide-react";

const navLinks = [
    { href: "/admin", label: "Inicio", icon: House },
    { href: "/admin/docentes", label: "Docentes", icon: GraduationCap },
    { href: "/admin/materias", label: "Materias", icon: BookOpen },
    { href: "/admin/periodos", label: "Periodos", icon: CalendarDays },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="flex min-h-screen w-64 flex-col bg-gradient-to-b from-blue-950 to-blue-900 p-6 text-white shadow-xl">
            <div className="mb-10">
                <div className="mb-1 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-lg">
                        <School className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-black tracking-tight">UPTEX Eval</h2>
                </div>
                <p className="pl-12 text-[11px] font-medium text-blue-300">Sistema FDA-24.5</p>
            </div>

            <nav className="flex-1 space-y-1.5">
                {navLinks.map(({ href, label, icon: Icon }) => {
                    const isActive =
                        href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                isActive
                                    ? "bg-white/15 text-white shadow-inner"
                                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                            {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white"></span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-white/10 pt-6">
                <p className="text-center text-[10px] font-medium leading-relaxed text-blue-400">
                    Tesina · UPTEX
                    <br />
                    Sistema de Evaluacion Docente
                </p>
            </div>
        </aside>
    );
}
