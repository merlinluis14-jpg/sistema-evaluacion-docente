import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CalendarDays, ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { getSessionRole } from "@/lib/sessionUser";
import { PERIODOS_UPTX } from "@/lib/uptxPeriods";

export const dynamic = "force-dynamic";

export default async function NuevoPeriodoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; plantilla?: string }>;
}) {
  const { error, plantilla } = await searchParams;

  const periodoSeleccionado = plantilla !== undefined
    ? PERIODOS_UPTX[parseInt(plantilla, 10)]
    : null;

  async function crearPeriodo(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || getSessionRole(session) !== "ADMIN") {
      redirect("/login");
    }

    const nombre = (formData.get("nombre") as string)?.trim();
    const inicio = formData.get("inicio") as string;
    const fin = formData.get("fin") as string;
    const activar = formData.get("activar") === "on";

    if (!nombre || !inicio || !fin) {
      redirect("/admin/periodos/nuevo?error=campos");
    }

    if (new Date(inicio) >= new Date(fin)) {
      redirect("/admin/periodos/nuevo?error=fechas");
    }

    try {
      if (activar) {
        await prisma.period.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      const period = await prisma.period.create({
        data: {
          name: nombre,
          startDate: new Date(inicio),
          endDate: new Date(fin),
          isActive: activar,
        },
      });

      await logAdminAction({
        action: activar ? "ACTIVATE" : "CREATE",
        entity: "PERIODO",
        entityId: period.id,
        detail: `${activar ? "Periodo creado y activado" : "Periodo creado"}: ${nombre}`,
      });
    } catch {
      redirect("/admin/periodos/nuevo?error=servidor");
    }

    redirect("/admin/periodos");
  }

  const mensajesError: Record<string, string> = {
    campos: "Completa todos los campos obligatorios.",
    fechas: "La fecha de inicio debe ser anterior a la fecha de fin.",
    servidor: "Error interno del servidor. Intenta de nuevo.",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <Link
        href="/admin/periodos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={15} /> Volver a Periodos
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Nuevo <span className="text-blue-600">Periodo</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Selecciona una plantilla del calendario UPTX o ingresa las fechas manualmente
        </p>
      </div>

      {error && mensajesError[error] && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-600">{mensajesError[error]}</p>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-blue-700">
          <CalendarDays className="h-4 w-4" /> Plantillas del Calendario Oficial UPTX
        </p>
        <p className="text-xs text-blue-500">
          Selecciona una para pre-llenar el formulario automaticamente
        </p>
        <div className="grid grid-cols-1 gap-2">
          {PERIODOS_UPTX.map((periodo, index) => (
            <Link
              key={periodo.nombre}
              href={`/admin/periodos/nuevo?plantilla=${index}`}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                plantilla === String(index)
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <span>{periodo.nombre}</span>
              <span className={`hidden font-mono text-xs sm:inline ${
                plantilla === String(index) ? "text-blue-100" : "text-slate-400"
              }`}>
                {periodo.inicio} - {periodo.fin}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-slate-900 px-6 py-4">
          <p className="font-black text-white">Datos del periodo</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Puedes ajustar las fechas segun el calendario institucional
          </p>
        </div>

        <form action={crearPeriodo} className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Nombre del periodo <span className="text-red-500">*</span>
            </label>
            <input
              name="nombre"
              required
              defaultValue={periodoSeleccionado?.nombre ?? ""}
              placeholder="Ej: Cuatrimestre Enero-Abril 2026"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Fecha de inicio <span className="text-red-500">*</span>
              </label>
              <input
                name="inicio"
                type="date"
                required
                defaultValue={periodoSeleccionado?.inicio ?? ""}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Fecha de fin <span className="text-red-500">*</span>
              </label>
              <input
                name="fin"
                type="date"
                required
                defaultValue={periodoSeleccionado?.fin ?? ""}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <input
              name="activar"
              type="checkbox"
              id="activar"
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-amber-500"
            />
            <div>
              <label htmlFor="activar" className="cursor-pointer text-sm font-bold text-amber-700">
                Activar este periodo inmediatamente
              </label>
              <p className="mt-0.5 text-xs text-amber-600">
                Desactivara el periodo actual y permitira que los alumnos comiencen a evaluar.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 active:scale-[0.99]"
            >
              Crear periodo
            </button>
            <Link
              href="/admin/periodos"
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
