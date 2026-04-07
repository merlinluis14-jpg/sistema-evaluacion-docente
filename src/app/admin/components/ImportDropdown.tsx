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
        className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
          <Upload className="h-5 w-5" />
        </div>
        <span className="text-sm font-bold text-slate-700 transition-colors group-hover:text-blue-600">
          Importar CSV
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          {importOptions.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="group/item flex items-center gap-3 px-4 py-3 transition-colors hover:bg-blue-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-colors group-hover/item:bg-white group-hover/item:text-blue-600">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-600 transition-colors group-hover/item:text-blue-700">
                {label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
