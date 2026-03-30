"use client";
// Sidebar del panel administrador - drawer en movil, fijo en escritorio

import { useState } from "react";
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
  Menu,
  X,
  LogOut,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/docentes", label: "Docentes", icon: Users },
  { href: "/admin/alumnos", label: "Alumnos", icon: GraduationCap },
  { href: "/admin/carreras", label: "Carreras", icon: BookOpen },
  { href: "/admin/grupos", label: "Grupos", icon: Layers },
  { href: "/admin/materias", label: "Materias", icon: BookOpen },
  { href: "/admin/periodos", label: "Periodos", icon: Calendar },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/admin/administradores", label: "Administradores", icon: ShieldCheck },
  { href: "/admin/logs", label: "Logs", icon: ClipboardList },
];

function SidebarContent({
  isActive,
  onClose,
  userEmail,
}: {
  isActive: (href: string) => boolean;
  onClose: () => void;
  userEmail: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <span className="text-sm font-black text-white">U</span>
          </div>
          <div>
            <p className="text-sm font-bold leading-none text-white">UPTEX Eval</p>
            <p className="mt-0.5 text-[10px] text-blue-300">Panel Administrador</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 transition-colors hover:text-white md:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <div className="border-b border-white/10 px-5 py-3">
        <p className="truncate text-xs font-bold text-white">{userEmail}</p>
        <p className="mt-0.5 text-[10px] text-blue-300">Administrador</p>
      </div>

      <nav className="scrollbar-hide flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-blue-500/20 text-white"
                  : "text-slate-400 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 px-4 py-4">
        <p className="truncate text-[10px] text-slate-500">{userEmail}</p>
        <SignOutButton className="flex flex-row items-center gap-2 border-none bg-transparent p-0 text-xs font-medium text-slate-400 transition-colors hover:text-red-400">
          <LogOut size={14} />
          Cerrar sesion
        </SignOutButton>
      </div>
    </div>
  );
}

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A5F] text-white shadow-lg md:hidden"
      >
        <Menu size={20} />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        className={`fixed left-0 top-0 z-50 h-full w-[86vw] max-w-xs transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#1E3A5F" }}
      >
        <SidebarContent isActive={isActive} onClose={() => setOpen(false)} userEmail={userEmail} />
      </div>

      <div
        className="hidden h-full flex-shrink-0 flex-col md:flex md:w-56 lg:w-64"
        style={{ background: "#1E3A5F" }}
      >
        <SidebarContent isActive={isActive} onClose={() => setOpen(false)} userEmail={userEmail} />
      </div>
    </>
  );
}
