
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ExportButtons from "./ExportButtons";
import { ClipboardList, UserCog, Calendar, BarChart2, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

// Mapa de clases estáticas para evitar interpolación dinámica de Tailwind
const NIVEL_TEXT: Record<string, string> = {
  emerald: "text-emerald-600",
  blue:    "text-blue-600",
  amber:   "text-amber-600",
  red:     "text-red-600",
  slate:   "text-slate-500",
};
const NIVEL_BADGE: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  blue:    "bg-blue-50 text-blue-700",
  amber:   "bg-amber-50 text-amber-700",
  red:     "bg-red-50 text-red-700",
  slate:   "bg-slate-50 text-slate-500",
};

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodoId?: string; carreraId?: string; materiaId?: string; grupoId?: string }>;
}) {
  const { periodoId: periodoIdParam, carreraId, materiaId, grupoId } = await searchParams;
  // Cargar filtros disponibles
  const [periodos, carreras, materias, grupos] = await Promise.all([
    prisma.period.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.career.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.subject.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, include: { teacher: true } }),
    prisma.group.findMany({ orderBy: { name: "asc" }, include: { career: true } }),
  ]);

  // Periodo seleccionado — por defecto el activo
  const periodoActivo = periodos.find(p => p.isActive);
  const periodoId = periodoIdParam ?? periodoActivo?.id;

  // Consulta de evaluaciones con todos los filtros
  const evaluaciones = await prisma.evaluation.findMany({
    where: {
      ...(periodoId ? { periodId: periodoId } : {}),
      ...(carreraId ? { teacher: { careerId: carreraId } } : {}),
      ...(materiaId ? { subjectId: materiaId } : {}),
      ...(grupoId ? {
        student: {
          groups: { some: { groupId: grupoId } },
        },
      } : {}),
    },
    include: {
      teacher: { include: { career: true } },
      subject: true,
      period: true,
    },
  });

  // Agrupar por docente y calcular promedios
  const docenteMap = new Map<string, {
    teacher: typeof evaluaciones[0]["teacher"];
    evals: typeof evaluaciones;
  }>();

  for (const ev of evaluaciones) {
    const key = ev.teacherId;
    if (!docenteMap.has(key)) {
      docenteMap.set(key, { teacher: ev.teacher, evals: [] });
    }
    docenteMap.get(key)!.evals.push(ev);
  }

  // Calcular promedios por docente
  const reporteDocentes = Array.from(docenteMap.values()).map(({ teacher, evals }) => {
    const avg = (nums: number[]) => {
      const validos = nums.filter(n => n > 0);
      return validos.length > 0
        ? validos.reduce((a, b) => a + b, 0) / validos.length
        : 0;
    };

    const facAvg = avg(evals.map(e =>
      avg([e.fac_item01, e.fac_item02, e.fac_item03, e.fac_item04, e.fac_item05,
      e.fac_item06, e.fac_item07, e.fac_item08, e.fac_item09, e.fac_item10, e.fac_item11])
    ));
    const habAvg = avg(evals.map(e =>
      avg([e.hab_item01, e.hab_item02, e.hab_item03, e.hab_item04])
    ));
    const medAvg = avg(evals.map(e =>
      avg([e.med_item01, e.med_item02, e.med_item03, e.med_item04, e.med_item05, e.med_item06])
    ));
    const autoAvg = avg(evals.map(e =>
      avg([e.auto_item01, e.auto_item02, e.auto_item03, e.auto_item04, e.auto_item05,
      e.auto_item06, e.auto_item07, e.auto_item08, e.auto_item09, e.auto_item10, e.auto_item11])
    ));

    const globalAvg = avg([facAvg, habAvg, medAvg]);

    // Calificación cualitativa
    const nivel = globalAvg >= 3.5 ? "Excelente"
      : globalAvg >= 2.5 ? "Bueno"
        : globalAvg >= 1.5 ? "Regular"
          : globalAvg > 0 ? "Deficiente"
            : "Sin datos";

    const nivelColor = globalAvg >= 3.5 ? "emerald"
      : globalAvg >= 2.5 ? "blue"
        : globalAvg >= 1.5 ? "amber"
          : globalAvg > 0 ? "red"
            : "slate";

    return {
      teacher,
      totalEvals: evals.length,
      facAvg: facAvg.toFixed(2),
      habAvg: habAvg.toFixed(2),
      medAvg: medAvg.toFixed(2),
      autoAvg: autoAvg.toFixed(2),
      globalAvg: globalAvg.toFixed(2),
      nivel,
      nivelColor,
      materias: [...new Set(evals.map(e => e.subject.name))],
    };
  }).sort((a, b) => parseFloat(b.globalAvg) - parseFloat(a.globalAvg));

  // Estadísticas generales del periodo
  const totalEvals = evaluaciones.length;
  const totalDocentes = reporteDocentes.length;
  const periodoNombre = periodos.find(p => p.id === periodoId)?.name ?? "Todos";
  const materiaNombre = materias.find(m => m.id === materiaId)?.name;
  const grupoNombre = grupos.find(g => g.id === grupoId);
  const hasFilters = !!(periodoIdParam || carreraId || materiaId || grupoId);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Reportes de <span className="text-blue-600">Evaluación</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Instrumento FDA-24.5 · {periodoNombre}
            {materiaNombre ? ` · ${materiaNombre}` : ""}
            {grupoNombre ? ` · Grupo ${grupoNombre.name} (${grupoNombre.career.code})` : ""}
          </p>
        </div>
        <ExportButtons
          data={reporteDocentes}
          periodo={periodoNombre}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <form className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Periodo
            </label>
            <select
              name="periodoId"
              defaultValue={periodoId}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Todos los periodos</option>
              {periodos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isActive ? "● Activo" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Carrera
            </label>
            <select
              name="carreraId"
              defaultValue={carreraId}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Todas las carreras</option>
              {carreras.map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Materia
            </label>
            <select
              name="materiaId"
              defaultValue={materiaId}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Todas las materias</option>
              {materias.map(m => (
                <option key={m.id} value={m.id}>{m.code} — {m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Grupo
            </label>
            <select
              name="grupoId"
              defaultValue={grupoId}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Todos los grupos</option>
              {grupos.map(g => (
                <option key={g.id} value={g.id}>{g.name} — {g.career.code} · {g.period}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-all"
          >
            Filtrar
          </button>

          {hasFilters && (
            <Link
              href="/admin/reportes"
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        {/* Total evaluaciones */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <ClipboardList className="w-5 h-5 mb-1 text-blue-500" />
          <p className="text-2xl font-black text-blue-700">{totalEvals}</p>
          <p className="text-xs font-bold text-blue-600 mt-0.5">Total evaluaciones</p>
        </div>

        {/* Docentes evaluados */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <UserCog className="w-5 h-5 mb-1 text-blue-500" />
          <p className="text-2xl font-black text-blue-700">{totalDocentes}</p>
          <p className="text-xs font-bold text-blue-600 mt-0.5">Docentes evaluados</p>
        </div>

        {/* Periodo activo */}
        <div className={`rounded-2xl p-5 ${periodoActivo ? "bg-blue-50 border border-blue-100" : "bg-slate-50 border border-slate-100"}`}>
          <Calendar className={`w-5 h-5 mb-1 ${periodoActivo ? "text-blue-500" : "text-slate-400"}`} />
          <p className={`text-2xl font-black ${periodoActivo ? "text-blue-700" : "text-slate-600"}`}>
            {periodoActivo ? "Sí" : "No"}
          </p>
          <p className={`text-xs font-bold mt-0.5 ${periodoActivo ? "text-blue-600" : "text-slate-500"}`}>
            Periodo activo
          </p>
        </div>

        {/* Promedio general */}
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
          <BarChart2 className="w-5 h-5 mb-1 text-violet-500" />
          <p className="text-2xl font-black text-violet-700">
            {reporteDocentes.length > 0
              ? (reporteDocentes.reduce((a, b) => a + parseFloat(b.globalAvg), 0) / reporteDocentes.length).toFixed(2)
              : "—"}
          </p>
          <p className="text-xs font-bold text-violet-600 mt-0.5">Promedio general</p>
        </div>

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-700">
            Resultados por Docente
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ordenados por promedio global descendente · Escala: Fac. /4 · Hab. /5 · Med. /5
          </p>
        </div>

        {reporteDocentes.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className="w-12 h-12 mb-3 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-500">No hay evaluaciones para este filtro</p>
            <p className="text-sm text-slate-400 mt-1">
              Selecciona un periodo con evaluaciones registradas
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Docente</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Carrera</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Evals.</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-blue-400 uppercase tracking-wider">Fac. /4</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-indigo-400 uppercase tracking-wider">Hab. /5</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-violet-400 uppercase tracking-wider">Med. /5</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Global</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Nivel</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reporteDocentes.map((doc, idx) => (
                  <tr key={doc.teacher.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Ranking */}
                    <td className="px-6 py-4">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? "bg-amber-100 text-amber-700"
                        : idx === 1 ? "bg-slate-100 text-slate-600"
                          : idx === 2 ? "bg-orange-100 text-orange-700"
                            : "bg-slate-50 text-slate-400"
                        }`}>
                        {idx + 1}
                      </span>
                    </td>

                    {/* Docente */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                          {doc.teacher.name[0]}{doc.teacher.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {doc.teacher.name} {doc.teacher.lastName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {doc.materias.slice(0, 2).join(", ")}
                            {doc.materias.length > 2 ? ` +${doc.materias.length - 2}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Carrera */}
                    <td className="px-4 py-4">
                      <span className="bg-indigo-50 text-indigo-700 font-black text-xs px-2 py-1 rounded-lg">
                        {doc.teacher.career.code}
                      </span>
                    </td>

                    {/* Evaluaciones */}
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-slate-600 text-sm">{doc.totalEvals}</span>
                    </td>

                    {/* Promedios por sección */}
                    <td className="px-4 py-4 text-center">
                      <span className="font-black text-blue-600">{doc.facAvg}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-black text-indigo-600">{doc.habAvg}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-black text-violet-600">{doc.medAvg}</span>
                    </td>

                    {/* Promedio global */}
                    <td className="px-4 py-4 text-center">
                      <span className={`font-black text-lg ${NIVEL_TEXT[doc.nivelColor] ?? "text-slate-500"}`}>
                        {doc.globalAvg}
                      </span>
                    </td>

                    {/* Nivel cualitativo */}
                    <td className="px-4 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${NIVEL_BADGE[doc.nivelColor] ?? "bg-slate-50 text-slate-500"}`}>
                        {doc.nivel}
                      </span>
                    </td>

                    {/* Ver detalle */}
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/reportes/${doc.teacher.id}${periodoId ? `?periodoId=${periodoId}` : ""}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        Ver detalle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
