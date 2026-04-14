import Link from "next/link";
import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NuevaCarreraPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <Link
        href="/admin/carreras"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={15} />
        Volver a Carreras
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Alta manual de <span className="text-blue-600">Carreras</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Este flujo ya no se usa porque el catálogo académico ahora viene desde el sistema de
          Horarios.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex items-center gap-2 text-blue-700">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-sm font-bold">Catálogo sincronizado</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-blue-700/90">
          Si una carrera nueva debe aparecer en Evaluación Docente, primero se registra en Horarios
          y después se ejecuta la sincronización académica. Así evitamos duplicados y mantenemos un
          solo catálogo maestro.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/admin/docentes/sincronizar"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
        >
          <RefreshCw className="h-4 w-4" />
          Ir a sincronizar academia
        </Link>
        <Link
          href="/admin/carreras"
          className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
        >
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
