import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import ImportarAlumnosClient from "./ImportarAlumnosClient";

export const dynamic = "force-dynamic";

export default async function ImportarAlumnosPage() {
  const activePeriod = await prisma.period.findFirst({
    where: { isActive: true },
    select: { name: true },
  });

  return (
    <div className="mx-auto max-w-7xl p-8 pb-20 sm:p-12">
      <div className="mb-2 flex items-center gap-4">
        <Link
          href="/admin/alumnos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft size={15} /> Volver a Alumnos
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">
          Importar <span className="text-blue-600">Alumnos</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Carga masiva desde archivo CSV. Los alumnos se asignan a grupos ya
          sincronizados desde el sistema de horarios.
        </p>
      </div>

      {!activePeriod ? (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-bold text-amber-800">
              No hay un periodo academico activo
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Activa un periodo desde{" "}
              <Link
                href="/admin/periodos"
                className="font-semibold underline hover:text-amber-900"
              >
                Gestion de Periodos
              </Link>{" "}
              antes de importar alumnos.
            </p>
          </div>
        </div>
      ) : (
        <ImportarAlumnosClient periodName={activePeriod.name} />
      )}
    </div>
  );
}
