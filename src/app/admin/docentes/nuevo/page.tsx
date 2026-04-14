import Link from "next/link";
import { AlertTriangle, ArrowLeft, CloudDownload } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NuevoDocentePage() {
  return (
    <div className="mx-auto max-w-4xl p-8 pb-20 sm:p-12">
      <div className="mb-2 flex items-center gap-4">
        <Link
          href="/admin/docentes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft size={15} /> Volver a Docentes
        </Link>
      </div>

      <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Nuevo <span className="text-blue-600">Docente</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            El alta manual de docentes ya no forma parte del flujo operativo.
          </p>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-2 text-sm text-amber-900">
            <p className="font-bold">
              Los docentes deben darse de alta en el sistema de Horarios.
            </p>
            <p>
              Para evitar duplicados y mantener la relación real con materias y
              grupos, las altas, bajas y cambios del catálogo docente se hacen en
              Horarios y después se sincronizan aquí.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          Si necesitas que un docente aparezca en este sistema, primero
          regístralo en Horarios y luego ejecuta la sincronización académica.
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/docentes/sincronizar"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700"
          >
            <CloudDownload size={16} /> Ir a sincronizar academia
          </Link>
          <Link
            href="/admin/docentes"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
