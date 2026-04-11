import Link from "next/link";
import { BookOpen, Building2, Inbox, RefreshCw, ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatAcademicText } from "@/lib/text/academicText";

export const dynamic = "force-dynamic";

type CareerViewMode = "activas" | "inactivas";

export default async function CarrerasPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const currentView: CareerViewMode = view === "inactivas" ? "inactivas" : "activas";

  const [activeCount, inactiveCount, careers] = await Promise.all([
    prisma.career.count({ where: { isActive: true } }),
    prisma.career.count({ where: { isActive: false } }),
    prisma.career.findMany({
      where: { isActive: currentView === "activas" },
      orderBy: { code: "asc" },
      include: {
        _count: {
          select: {
            teachers: true,
            students: true,
            groups: true,
            subjects: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 p-8 pb-20 duration-700 sm:p-12">
      <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Catalogo de <span className="text-blue-600">Carreras</span>
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            Este modulo ahora trabaja en modo de solo lectura y refleja las carreras que llegan
            desde el sistema de Horarios.
          </p>
        </div>

        <Link
          href="/admin/docentes/sincronizar"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 active:scale-[0.99]"
        >
          <RefreshCw size={16} />
          Sincronizar academia
        </Link>
      </div>

      <div className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-5 py-4">
          <ShieldCheck className="h-4 w-4 text-blue-700" />
          <p className="text-sm font-black text-blue-800">
            Fuente de verdad: Sistema de Horarios
          </p>
        </div>
        <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-bold text-slate-700">Flujo recomendado</p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>1. La jefa de carrera actualiza carreras, docentes, materias y grupos en Horarios.</li>
              <li>2. Aqui se ejecuta una sincronizacion completa para traer ese catalogo.</li>
              <li>3. Despues se importan alumnos usando el grupo y la carrera ya sincronizados.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-700">Importante</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Las carreras ya no se capturan manualmente en este sistema. Si una carrera no aparece
              aqui, primero debe existir en el sistema de Horarios y despues sincronizarse.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/admin/carreras"
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
            currentView === "activas"
              ? "bg-blue-700 text-white shadow-lg shadow-blue-700/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Activas
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              currentView === "activas" ? "bg-white/15 text-white" : "bg-white text-slate-600"
            }`}
          >
            {activeCount}
          </span>
        </Link>

        <Link
          href="/admin/carreras?view=inactivas"
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
            currentView === "inactivas"
              ? "bg-slate-700 text-white shadow-lg shadow-slate-700/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Inactivas
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              currentView === "inactivas" ? "bg-white/15 text-white" : "bg-white text-slate-600"
            }`}
          >
            {inactiveCount}
          </span>
        </Link>
      </div>

      {currentView === "inactivas" ? (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm font-bold text-slate-700">Vista de referencia</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Estas carreras llegaron desde Horarios, pero hoy estan inactivas. Se conservan solo
            como referencia historica y no forman parte del catalogo operativo principal.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {careers.map((career) => (
          <div
            key={career.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-xl"
          >
            <div className="flex-1 p-1.5">
              <div className="flex h-full flex-col rounded-xl bg-slate-50 p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-xl font-black text-blue-600 shadow-sm transition-transform duration-500 group-hover:scale-110">
                    {career.code}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        career.isActive ? "bg-blue-50 text-blue-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {career.isActive ? "Activa" : "Inactiva"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Horarios
                    </span>
                  </div>
                </div>

                <h3 className="mb-6 text-xl font-bold leading-tight text-slate-800 transition-colors group-hover:text-blue-700">
                  {formatAcademicText(career.name)}
                </h3>

                <div className="mt-auto grid grid-cols-4 gap-2">
                  <div className="rounded-xl border border-slate-100 bg-white/70 p-2.5 text-center">
                    <p className="text-xs font-bold uppercase tracking-tighter text-slate-400">Docs</p>
                    <p className="text-lg font-black text-slate-700">{career._count.teachers}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white/70 p-2.5 text-center">
                    <p className="text-xs font-bold uppercase tracking-tighter text-slate-400">Alum</p>
                    <p className="text-lg font-black text-slate-700">{career._count.students}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white/70 p-2.5 text-center">
                    <p className="text-xs font-bold uppercase tracking-tighter text-slate-400">Grup</p>
                    <p className="text-lg font-black text-slate-700">{career._count.groups}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white/70 p-2.5 text-center">
                    <p className="text-xs font-bold uppercase tracking-tighter text-slate-400">Mat</p>
                    <p className="text-lg font-black text-slate-700">{career._count.subjects}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-50 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <Link
                  href={`/admin/docentes?career=${career.id}`}
                  className="text-xs font-bold text-blue-600 transition-colors hover:text-blue-800"
                >
                  Ver docentes relacionados →
                </Link>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all group-hover:bg-blue-50 group-hover:text-blue-500">
                  <BookOpen size={14} />
                </div>
              </div>
            </div>
          </div>
        ))}

        {careers.length === 0 ? (
          <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 py-20 text-center">
            <Inbox size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-500">
              {currentView === "activas"
                ? "Aun no hay carreras activas sincronizadas en el sistema."
                : "No hay carreras inactivas para mostrar."}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {currentView === "activas"
                ? "Ejecuta una sincronizacion academica para traer el catalogo desde Horarios."
                : "Cuando una carrera deje de venir activa desde Horarios, aparecera aqui como referencia."}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Building2 className="h-4 w-4 text-blue-600" />
          <p className="text-sm font-bold">Catalogo protegido</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Si necesitas cambiar el nombre, codigo o vigencia de una carrera, el ajuste debe hacerse
          en el sistema de Horarios y despues volver a sincronizar aqui.
        </p>
      </div>
    </div>
  );
}
