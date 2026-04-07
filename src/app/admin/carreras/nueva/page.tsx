import Link from "next/link";
import { AlertTriangle, ArrowLeft, Building2 } from "lucide-react";

import { createCareer } from "../actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  campos: "Completa todos los campos obligatorios.",
  codigo:
    "El codigo debe usar solo letras, numeros o guiones y medir entre 2 y 12 caracteres.",
  duplicado: "Ya existe una carrera con ese codigo.",
};

export default async function NuevaCarreraPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <Link
        href="/admin/carreras"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={15} />
        Volver a Carreras
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Nueva <span className="text-blue-600">Carrera</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Registra una carrera institucional para que quede disponible en catalogos e importaciones.
        </p>
      </div>

      {error && errorMessages[error] ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-600">{errorMessages[error]}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-blue-700">
          <Building2 className="h-4 w-4" />
          Compatibilidad con CSV
        </p>
        <p className="mt-2 text-sm text-blue-600">
          El codigo de carrera se usa en tus importaciones CSV. Por eso se define al crearla y luego se conserva estable.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-slate-900 px-6 py-4">
          <p className="font-black text-white">Datos de la carrera</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Usa un codigo corto institucional, por ejemplo ISC, IRO o LAGE.
          </p>
        </div>

        <form action={createCareer} className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Codigo <span className="text-red-500">*</span>
            </label>
            <input
              name="code"
              required
              placeholder="Ej: ISC"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm uppercase outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              Se guardara en mayusculas y sera la referencia usada por tus archivos CSV.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Nombre oficial <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="Ej: Ingenieria en Sistemas Computacionales"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 active:scale-[0.99]"
            >
              Crear carrera
            </button>
            <Link
              href="/admin/carreras"
              className="rounded-xl bg-slate-100 px-6 py-3 text-center text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
