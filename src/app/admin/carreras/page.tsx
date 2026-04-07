import Link from "next/link";
import { BookOpen, Inbox, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { CareerStatusButton } from "./CareerStatusButton";

export const dynamic = "force-dynamic";

const successMessages: Record<string, string> = {
  creada: "La carrera se creo correctamente.",
  actualizada: "La carrera se actualizo correctamente.",
};

const errorMessages: Record<string, string> = {
  "no-encontrada": "La carrera solicitada ya no existe.",
};

export default async function CarrerasPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;

  const careers = await prisma.career.findMany({
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
  });

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 p-8 pb-20 duration-700 sm:p-12">
      <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Gestion de <span className="text-blue-600">Carreras</span>
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            Administra el catalogo oficial de carreras sin comprometer la compatibilidad de importacion por codigo.
          </p>
        </div>

        <Link
          href="/admin/carreras/nueva"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 active:scale-[0.99]"
        >
          <Plus size={16} />
          Nueva carrera
        </Link>
      </div>

      {success && successMessages[success] ? (
        <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessages[success]}
        </div>
      ) : null}

      {error && errorMessages[error] ? (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessages[error]}
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-2xl font-black text-blue-600 shadow-sm transition-transform duration-500 group-hover:scale-110">
                    {career.code}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      career.isActive ? "bg-blue-50 text-blue-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {career.isActive ? "Activa" : "Inactiva"}
                  </span>
                </div>

                <h3 className="mb-6 text-xl font-bold leading-tight text-slate-800 transition-colors group-hover:text-blue-700">
                  {career.name}
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

            <div className="space-y-3 border-t border-slate-50 bg-white px-6 py-4">
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

              <CareerStatusButton
                careerId={career.id}
                careerCode={career.code}
                careerName={career.name}
                isActive={career.isActive}
              />
            </div>
          </div>
        ))}

        {careers.length === 0 ? (
          <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 py-20 text-center">
            <Inbox size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-500">No se han registrado carreras en el sistema.</p>
            <p className="mt-1 text-sm text-slate-400">
              Agrega una carrera manualmente para habilitar catalogos e importaciones.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
