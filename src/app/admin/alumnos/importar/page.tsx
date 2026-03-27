// Server component — fetches the active period and passes it to the client form
import { prisma } from "@/lib/prisma";
import ImportarAlumnosClient from "./ImportarAlumnosClient";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ImportarAlumnosPage() {
    const activePeriod = await prisma.period.findFirst({
        where: { isActive: true },
        select: { name: true },
    });

    return (
        <div className="p-8 pb-20 sm:p-12 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/admin/alumnos" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium">
                    <ArrowLeft size={15} /> Volver a Alumnos
                </Link>
            </div>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800">Importar <span className="text-blue-600">Alumnos</span></h1>
                <p className="text-slate-400 text-sm mt-1">Carga masiva desde archivo CSV — los grupos se crean automáticamente</p>
            </div>

            {!activePeriod ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-bold text-amber-800">No hay un periodo académico activo</p>
                        <p className="text-sm text-amber-700 mt-1">
                            Activa un periodo desde{" "}
                            <Link href="/admin/periodos" className="underline font-semibold hover:text-amber-900">
                                Gestión de Periodos
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
