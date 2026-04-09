import Link from "next/link";
import { AlertTriangle, ArrowLeft, Layers3 } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { syncSubjectsForGroup } from "@/lib/groupAssignments";
import { prisma } from "@/lib/prisma";
import { getSessionRole } from "@/lib/sessionUser";
import { formatAcademicText } from "@/lib/text/academicText";

export const dynamic = "force-dynamic";

export default async function NuevoGrupoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [careers, activePeriod] = await Promise.all([
    prisma.career.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    prisma.period.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  async function crearGrupo(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || getSessionRole(session) !== "ADMIN") {
      redirect("/login");
    }

    const currentActivePeriod = await prisma.period.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
      select: { name: true },
    });

    if (!currentActivePeriod) {
      redirect("/admin/grupos/nuevo?error=periodo");
    }

    const name = String(formData.get("name") ?? "").trim().toUpperCase();
    const careerId = String(formData.get("careerId") ?? "").trim();
    const period = currentActivePeriod.name;

    if (!name || !careerId) {
      redirect("/admin/grupos/nuevo?error=campos");
    }

    const existingGroup = await prisma.group.findFirst({
      where: {
        careerId,
        period,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existingGroup) {
      redirect("/admin/grupos?error=duplicado");
    }

    const group = await prisma.group.create({
      data: {
        name,
        period,
        careerId,
        isActive: true,
      },
      include: {
        career: true,
      },
    });

    const linkedSubjects = await syncSubjectsForGroup(group.id, group.careerId, group.name);

    await logAdminAction({
      action: "CREATE",
      entity: "GRUPO",
      entityId: group.id,
      detail: `Grupo creado: ${group.name} / ${group.period} / ${group.career.code}. Materias enlazadas automaticamente: ${linkedSubjects}.`,
    });

    redirect("/admin/grupos?success=creado");
  }

  const mensajesError: Record<string, string> = {
    campos: "Completa todos los campos obligatorios.",
    periodo: "Debes tener un periodo activo para registrar grupos manualmente.",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <Link
        href="/admin/grupos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={15} />
        Volver a Grupos
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Nuevo <span className="text-blue-600">Grupo</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Da de alta grupos manualmente cuando no provengan de una importacion CSV
        </p>
      </div>

      {error && mensajesError[error] ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-600">{mensajesError[error]}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-blue-700">
          <Layers3 className="h-4 w-4" />
          Enlace automatico por cuatrimestre
        </p>
        <p className="mt-2 text-sm text-blue-600">
          Si el grupo inicia con un numero como <strong>3A</strong> o <strong>5B</strong>,
          el sistema intenta enlazar automaticamente las materias activas del mismo cuatrimestre.
        </p>
      </div>

      {!activePeriod ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
          No hay un periodo activo en el sistema. Activa un periodo antes de crear grupos manuales.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-slate-900 px-6 py-4">
          <p className="font-black text-white">Datos del grupo</p>
          <p className="mt-0.5 text-xs text-slate-400">
            El nombre del grupo se guarda en mayusculas para mantener consistencia institucional
          </p>
        </div>

        <form action={crearGrupo} className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Nombre del grupo <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="Ej: 3A"
              disabled={!activePeriod}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Periodo activo
            </label>
            <input
              value={activePeriod?.name ?? "Sin periodo activo"}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              Los grupos manuales se registran automaticamente dentro del periodo activo.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Carrera <span className="text-red-500">*</span>
            </label>
            <select
              name="careerId"
              required
              defaultValue=""
              disabled={!activePeriod}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="" disabled>
                Selecciona una carrera
              </option>
              {careers.map((career) => (
                <option key={career.id} value={career.id}>
                  {career.code} - {formatAcademicText(career.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!activePeriod}
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              Crear grupo
            </button>
            <Link
              href="/admin/grupos"
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
