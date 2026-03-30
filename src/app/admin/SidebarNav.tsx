"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Layers,
    Calendar,
    BarChart3,
    ShieldCheck,
    LogOut,
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

const navItems = [
    { href: "/admin",          Icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/docentes", Icon: Users,           label: "Docentes"  },
    { href: "/admin/alumnos",  Icon: GraduationCap,   label: "Alumnos"   },
    { href: "/admin/carreras", Icon: BookOpen,        label: "Carreras"  },
    { href: "/admin/grupos",   Icon: Layers,          label: "Grupos"    },
    { href: "/admin/materias", Icon: BookOpen,        label: "Materias"  },
    { href: "/admin/periodos", Icon: Calendar,        label: "Periodos"  },
    { href: "/admin/reportes", Icon: BarChart3,       label: "Reportes"  },
    { href: "/admin/administradores", Icon: ShieldCheck, label: "Administradores" },
];

export function SidebarNav({ email }: { email: string }) {
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

    return (
        <>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map(({ href, Icon, label }) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                                active
                                    ? "bg-blue-500/20 text-white"
                                    : "text-[#94A3B8] hover:text-white hover:bg-white/[0.08]"
                            }`}
                        >
                            <Icon size={16} className="flex-shrink-0" />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="px-4 py-4 border-t border-white/10 space-y-2">
                <p className="text-slate-500 text-[10px] truncate">{email}</p>
                <SignOutButton
                    className="flex flex-row items-center gap-2 text-[#94A3B8] hover:text-red-400 transition-colors text-xs font-medium bg-transparent border-none p-0 cursor-pointer"
                >
                    <LogOut size={14} /> Cerrar sesión
                </SignOutButton>
            </div>
        </>
    );
}
