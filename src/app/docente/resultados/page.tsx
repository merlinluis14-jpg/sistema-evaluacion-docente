// Mis Resultados — lista de materias evaluadas con promedios por sección

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const NIVEL_BADGE: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue:    "bg-blue-100 text-blue-700",
  amber:   "bg-amber-100 text-amber-700",
  red:     "bg-red-100 text-red-700",
  slate:   "bg-slate-100 text-slate-500",
};

export default async function DocenteResultadosPage() {
  const session = await getServerSession(authOptions);

  const teacher = await prisma.teacher.findFirst({
    where: { user: { id: session!.user.id! } },
    include: { career: true },
  });
  if (!teacher) redirect("/login");

  const periodoActivo = await prisma.period.findFirst({
    where: { isActive: true },
  });

  // Obtener todas las materias del docente que tienen al menos una evaluación
  const evaluaciones = await prisma.evaluation.findMany({
    where: {
      teacherId: teacher.id,
      ...(periodoActivo ? { periodId: periodoActivo.id } : {}),
    },
    include: { subject: true },
  });

  // Agrupar evaluaciones por materia
  const materiasMap = new Map<string, {
    subject: typeof evaluaciones[0]["subject"];
    evals: typeof evaluaciones;
  }>();

  for (const ev of evaluaciones) {
    const key = ev.subjectId;
    if (!materiasMap.has(key)) {
      materiasMap.set(key, { subject: ev.subject, evals: [] });
    }
    materiasMap.get(key)!.evals.push(ev);
  }

  // Calcular promedios por materia
  const resultados = Array.from(materiasMap.values()).map(({ subject, evals }) => {
    const n = evals.length;
    const avgSection = (keys: (keyof typeof evals[0])[]) => {
      const valores = evals.flatMap(e =>
        keys.map(k => Number(e[k]) || 0).filter(v => v > 0)
      );
      return valores.length > 0
        ? parseFloat((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2))
        : 0;
    };

    const facAvg = avgSection([
      "fac_item01","fac_item02","fac_item03","fac_item04","fac_item05",
      "fac_item06","fac_item07","fac_item08","fac_item09","fac_item10","fac_item11"
    ]);
    const habAvg = avgSection(["hab_item01","hab_item02","hab_item03","hab_item04"]);
    const medAvg = avgSection(["med_item01","med_item02","med_item03","med_item04","med_item05","med_item06"]);
    const globalAvg = parseFloat(((facAvg + habAvg + medAvg) / 3).toFixed(2));

    const nivel = globalAvg >= 3.5 ? "Excelente"
      : globalAvg >= 2.5 ? "Bueno"
      : globalAvg >= 1.5 ? "Regular"
      : globalAvg > 0    ? "Deficiente"
      : "Sin datos";

    const nivelColor = globalAvg >= 3.5 ? "emerald"
      : globalAvg >= 2.5 ? "blue"
      : globalAvg >= 1.5 ? "amber"
      : globalAvg > 0    ? "red"
      : "slate";

    return { subject, n, facAvg, habAvg, medAvg, globalAvg, nivel, nivelColor };
  });

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Mis <span className="text-emerald-600">Resultados</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {teacher.name} {teacher.lastName} · {periodoActivo?.name ?? "Sin periodo activo"}
        </p>
      </div>

      {/* Sin evaluaciones */}
      {resultados.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-bold text-slate-600">Aún no tienes evaluaciones</p>
          <p className="text-sm text-slate-400 mt-1">
            Los alumnos podrán evaluarte cuando el periodo esté activo.
          </p>
        </div>
      )}

      {/* Grid de materias evaluadas */}
      {resultados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resultados.map(({ subject, n, facAvg, habAvg, medAvg, globalAvg, nivel, nivelColor }) => (
            <div
              key={subject.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-emerald-100 transition-all"
            >
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-mono text-slate-400">{subject.code}</span>
                  <h3 className="font-black text-slate-800 text-lg leading-tight mt-0.5">
                    {subject.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {n} evaluación{n !== 1 ? "es" : ""} recibida{n !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black text-slate-800">{globalAvg}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${NIVEL_BADGE[nivelColor] ?? "bg-slate-100 text-slate-500"}`}>
                    {nivel}
                  </span>
                </div>
              </div>

              {/* Barras de sección */}
              <div className="space-y-2 mb-5">
                {[
                  { label: "Facilitador", valor: facAvg, max: 4, color: "bg-blue-500" },
                  { label: "Habilidades", valor: habAvg, max: 5, color: "bg-indigo-500" },
                  { label: "Medios Did.", valor: medAvg, max: 5, color: "bg-violet-500" },
                ].map(({ label, valor, max, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-24 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full`}
                        style={{ width: `${(valor / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 w-10 text-right">
                      {valor}<span className="text-slate-300">/{max}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href={`/docente/resultados/${subject.id}`}
                className="block w-full text-center py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 active:scale-[0.99] transition-all"
              >
                Ver detalle por ítem →
              </Link>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
