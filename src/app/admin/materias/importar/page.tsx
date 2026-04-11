import Link from "next/link";
import { AlertTriangle, ArrowLeft, CloudDownload } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ImportarMateriasPage() {
  return (
    <div className="mx-auto max-w-4xl p-8 pb-20 sm:p-12">
      <div className="mb-2 flex items-center gap-4">
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
          href="/admin/materias"
        >
          <ArrowLeft size={15} /> Volver a Materias
        </Link>
      </div>

      <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Importar <span className="text-blue-600">Materias</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Esta importacion manual ya no forma parte del flujo operativo.
          </p>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-2 text-sm text-amber-900">
            <p className="font-bold">
              El catalogo de materias ahora se alimenta desde el sistema de horarios.
            </p>
            <p>
              Para mantener la relacion real entre materia, docente y grupo, las
              materias deben capturarse en Horarios y reflejarse aqui mediante la
              sincronizacion academica.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          Flujo recomendado: primero actualiza el catalogo en Horarios, luego
          sincroniza academia para traer materias, grupos y asignaciones exactas
          a este sistema.
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/docentes/sincronizar"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700"
          >
            <CloudDownload size={16} /> Ir a sincronizar academia
          </Link>
          <Link
            href="/admin/materias"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
          >
            Volver al catalogo
          </Link>
        </div>
      </div>
    </div>
  );
}
