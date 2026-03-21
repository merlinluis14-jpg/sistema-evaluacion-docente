
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Fechas del Calendario Escolar Oficial UPTX 2025-2026
const PERIODOS_UPTX = [
  {
    nombre: "Cuatrimestre Septiembre-Diciembre 2025",
    inicio: "2025-09-02",
    fin:    "2025-12-19",
  },
  {
    nombre: "Cuatrimestre Enero-Abril 2026",
    inicio: "2026-01-08",
    fin:    "2026-04-30",
  },
  {
    nombre: "Cuatrimestre Mayo-Agosto 2026",
    inicio: "2026-05-05",
    fin:    "2026-08-28",
  },
  {
    nombre: "Cuatrimestre Septiembre-Diciembre 2026",
    inicio: "2026-09-01",
    fin:    "2026-12-18",
  },
  {
    nombre: "Cuatrimestre Enero-Abril 2027",
    inicio: "2027-01-11",
    fin:    "2027-04-30",
  },
];

export default async function NuevoPeriodoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; plantilla?: string }>;
}) {
  const { error, plantilla } = await searchParams;

  const periodoSeleccionado = plantilla !== undefined
    ? PERIODOS_UPTX[parseInt(plantilla)]
    : null;

  async function crearPeriodo(formData: FormData) {
    "use server";

    const nombre  = (formData.get("nombre") as string)?.trim();
    const inicio  = formData.get("inicio") as string;
    const fin     = formData.get("fin") as string;
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
          data:  { isActive: false },
        });
      }

      await prisma.period.create({
        data: {
          name:      nombre,
          startDate: new Date(inicio),
          endDate:   new Date(fin),
          isActive:  activar,
        },
      });
    } catch {
      redirect("/admin/periodos/nuevo?error=servidor");
    }

    redirect("/admin/periodos");
  }

  const mensajesError: Record<string, string> = {
    campos:   "Completa todos los campos obligatorios.",
    fechas:   "La fecha de inicio debe ser anterior a la fecha de fin.",
    servidor: "Error interno del servidor. Intenta de nuevo.",
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">

      <Link
        href="/admin/periodos"
        className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
      >
        ← Volver a Periodos
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Nuevo <span className="text-blue-600">Periodo</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Selecciona una plantilla del calendario UPTX o ingresa las fechas manualmente
        </p>
      </div>

      {error && mensajesError[error] && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-red-500">⚠️</span>
          <p className="text-sm text-red-600 font-medium">{mensajesError[error]}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-blue-700">📅 Plantillas del Calendario Oficial UPTX</p>
        <p className="text-xs text-blue-500">
          Selecciona una para pre-llenar el formulario automáticamente
        </p>
        <div className="grid grid-cols-1 gap-2">
          {PERIODOS_UPTX.map((p, idx) => (
            <Link
              key={idx}
              href={`/admin/periodos/nuevo?plantilla=${idx}`}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                plantilla === String(idx)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <span>{p.nombre}</span>
              <span className={`text-xs font-mono hidden sm:inline ${
                plantilla === String(idx) ? "text-blue-100" : "text-slate-400"
              }`}>
                {p.inicio} → {p.fin}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4">
          <p className="font-black text-white">Datos del periodo</p>
          <p className="text-slate-400 text-xs mt-0.5">
            Puedes ajustar las fechas según el calendario institucional
          </p>
        </div>

        <form action={crearPeriodo} className="p-6 space-y-5">

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Nombre del periodo <span className="text-red-500">*</span>
            </label>
            <input
              name="nombre"
              required
              defaultValue={periodoSeleccionado?.nombre ?? ""}
              placeholder="Ej: Cuatrimestre Enero-Abril 2026"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Fecha de inicio <span className="text-red-500">*</span>
              </label>
              <input
                name="inicio"
                type="date"
                required
                defaultValue={periodoSeleccionado?.inicio ?? ""}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Fecha de fin <span className="text-red-500">*</span>
              </label>
              <input
                name="fin"
                type="date"
                required
                defaultValue={periodoSeleccionado?.fin ?? ""}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <input
              name="activar"
              type="checkbox"
              id="activar"
              className="mt-0.5 w-4 h-4 accent-amber-500 flex-shrink-0"
            />
            <div>
              <label htmlFor="activar" className="text-sm font-bold text-amber-700 cursor-pointer">
                Activar este periodo inmediatamente
              </label>
              <p className="text-xs text-amber-600 mt-0.5">
                Desactivará el periodo actual y permitirá que los alumnos comiencen a evaluar.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 active:scale-[0.99] transition-all shadow-lg shadow-blue-500/20"
            >
              Crear periodo
            </button>
            <Link
              href="/admin/periodos"
              className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all text-center"
            >
              Cancelar
            </Link>
          </div>

        </form>
      </div>

    </div>
  );
}
