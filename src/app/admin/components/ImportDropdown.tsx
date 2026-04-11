"use client";

import Link from "next/link";
import { GraduationCap, Upload } from "lucide-react";

export default function ImportDropdown() {
  return (
    <Link
      href="/admin/alumnos/importar"
      className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
        <Upload className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-700 transition-colors group-hover:text-blue-700">
          Importar Alumnos
        </p>
        <p className="text-xs text-slate-400 transition-colors group-hover:text-slate-500">
          Carga el roster del periodo activo
        </p>
      </div>
      <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
        <GraduationCap className="h-4 w-4" />
      </div>
    </Link>
  );
}
