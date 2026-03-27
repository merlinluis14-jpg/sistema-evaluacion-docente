"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Upload, GraduationCap, UserCog, BookOpen, ChevronDown } from "lucide-react";

const importOptions = [
  { href: "/admin/alumnos/importar",  label: "Importar Alumnos",  Icon: GraduationCap },
  { href: "/admin/docentes/importar", label: "Importar Docentes", Icon: UserCog },
  { href: "/admin/materias/importar", label: "Importar Materias", Icon: BookOpen },
];

export default function ImportDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group w-full"
      >
        <Upload className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
        <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
          Importar CSV
        </span>
        <ChevronDown
          className={`w-4 h-4 ml-auto text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {importOptions.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group/item"
            >
              <Icon className="w-4 h-4 text-slate-400 group-hover/item:text-blue-600 transition-colors" />
              <span className="text-sm font-medium text-slate-600 group-hover/item:text-blue-700 transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
