import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { updateCareer } from "../../actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  campos: "Completa todos los campos obligatorios.",
};

export default async function EditarCarreraPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);

  const career = await prisma.career.findUnique({
    where: { id },
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

  if (!career) {
    notFound();
  }

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
          Editar <span className="text-blue-600">Carrera</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Puedes actualizar el nombre visible sin comprometer la compatibilidad con las importaciones CSV.
        </p>
      </div>

      {error && errorMessages[error] ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-600">{errorMessages[error]}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-700">
          <ShieldCheck className="h-4 w-4" />
          Codigo protegido para no romper importaciones
        </p>
        <p className="mt-2 text-sm text-amber-700">
          El codigo <strong>{career.code}</strong> se mantiene estable porque es la referencia que usan tus CSV.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-slate-900 px-6 py-4">
          <p className="font-black text-white">Datos de la carrera</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Ajusta el nombre oficial sin perder compatibilidad con catalogos existentes.
          </p>
        </div>

        <form action={updateCareer} className="space-y-5 p-6">
          <input type="hidden" name="id" value={career.id} />

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Codigo</label>
            <input
              value={career.code}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-slate-500 outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Nombre oficial <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              defaultValue={career.name}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-white p-3 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Docs</p>
              <p className="mt-1 text-lg font-black text-slate-700">{career._count.teachers}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Alumnos</p>
              <p className="mt-1 text-lg font-black text-slate-700">{career._count.students}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Materias</p>
              <p className="mt-1 text-lg font-black text-slate-700">{career._count.subjects}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Grupos</p>
              <p className="mt-1 text-lg font-black text-slate-700">{career._count.groups}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 active:scale-[0.99]"
            >
              Guardar cambios
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
