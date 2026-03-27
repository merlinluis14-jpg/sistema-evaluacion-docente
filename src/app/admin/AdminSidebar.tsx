"use client";
// Sidebar del panel administrador — drawer en móvil, fijo en escritorio

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  Layers, Calendar, BarChart3, Menu, X, LogOut, ClipboardList,
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

const NAV_ITEMS = [
  { href: "/admin",          label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/docentes", label: "Docentes",   icon: Users           },
  { href: "/admin/alumnos",  label: "Alumnos",    icon: GraduationCap   },
  { href: "/admin/carreras", label: "Carreras",   icon: BookOpen        },
  { href: "/admin/grupos",   label: "Grupos",     icon: Layers          },
  { href: "/admin/materias", label: "Materias",   icon: BookOpen        },
  { href: "/admin/periodos", label: "Periodos",   icon: Calendar        },
  { href: "/admin/reportes", label: "Reportes",   icon: BarChart3       },
  { href: "/admin/logs",     label: "Logs",       icon: ClipboardList   },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">U</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">UPTEX Eval</p>
            <p className="text-blue-300 text-[10px] mt-0.5">Panel Administrador</p>
          </div>
        </div>
        {/* Botón cerrar en móvil */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Email */}
      <div className="px-5 py-3 border-b border-white/10">
        <p className="text-white text-xs font-bold truncate">{userEmail}</p>
        <p className="text-blue-300 text-[10px] mt-0.5">Administrador</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-blue-500/20 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 space-y-2">
        <p className="text-slate-500 text-[10px] truncate">{userEmail}</p>
        <SignOutButton
          className="flex flex-row items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-xs font-medium bg-transparent border-none p-0"
        >
          <LogOut size={14} />
          Cerrar sesión
        </SignOutButton>
      </div>
    </div>
  );

  return (
    <>
      {/* Botón hamburguesa — solo visible en móvil */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 bg-[#1E3A5F] text-white rounded-xl flex items-center justify-center shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Overlay oscuro en móvil */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar móvil — drawer desde la izquierda */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#1E3A5F" }}
      >
        <SidebarContent />
      </div>

      {/* Sidebar escritorio — siempre visible */}
      <div
        className="hidden md:flex md:flex-col md:w-56 md:flex-shrink-0 md:h-full"
        style={{ background: "#1E3A5F" }}
      >
        <SidebarContent />
      </div>
    </>
  );
}
