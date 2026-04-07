import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, BookOpen, ClipboardList, Sparkles } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildStudentReport,
  getPerformanceLevel,
  getPerformanceLevelColor,
} from "@/lib/reportes";

export const dynamic = "force-dynamic";

const NIVEL_BADGE: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-500",
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

  const evaluaciones = await prisma.evaluation.findMany({
    where: {
      teacherId: teacher.id,
      ...(periodoActivo ? { periodId: periodoActivo.id } : {}),
    },
    include: { subject: true },
  });

  const materiasMap = new Map<
    string,
    {
      subject: (typeof evaluaciones)[number]["subject"];
      evals: typeof evaluaciones;
    }
  >();

  for (const evaluation of evaluaciones) {
    const key = evaluation.subjectId;
    if (!materiasMap.has(key)) {
      materiasMap.set(key, { subject: evaluation.subject, evals: [] });
    }
    materiasMap.get(key)!.evals.push(evaluation);
  }

  const resultados = Array.from(materiasMap.values())
    .map(({ subject, evals }) => {
      const n = evals.length;
      const { promedios } = buildStudentReport(evals);
      const facAvg = promedios.fac;
      const habAvg = promedios.hab;
      const medAvg = promedios.med;
      const globalAvg = promedios.global;
      const nivel = getPerformanceLevel(globalAvg);
      const nivelColor = getPerformanceLevelColor(globalAvg);

      return { subject, n, facAvg, habAvg, medAvg, globalAvg, nivel, nivelColor };
    })
    .sort((a, b) => b.globalAvg - a.globalAvg);

  const globalTeacherAverage =
    evaluaciones.length > 0 ? buildStudentReport(evaluaciones).promedios.global.toFixed(2) : "0.00";

  return (
    <div className="relative space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-x-6 top-4 -z-10 h-72 rounded-[2rem] bg-gradient-to-b from-emerald-50/70 via-slate-50 to-transparent blur-2xl sm:inset-x-10" />

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-24 w-24 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Panel de Resultados
            </div>

            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-lg font-black text-white">
                {teacher.name[0]}
                {teacher.lastName[0]}
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-black text-slate-800 sm:text-3xl">
                  Mis Resultados
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {teacher.name} {teacher.lastName} · {teacher.career.name}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {periodoActivo?.name ?? "Sin periodo activo"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {resultados.length} materia{resultados.length !== 1 ? "s" : ""} evaluada
                    {resultados.length !== 1 ? "s" : ""}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {evaluaciones.length} evaluacion{evaluaciones.length !== 1 ? "es" : ""} recibida
                    {evaluaciones.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Promedio General</span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-800">{globalTeacherAverage}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Materias</span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-800">{resultados.length}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <ClipboardList className="h-4 w-4 text-indigo-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Evaluaciones</span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-800">{evaluaciones.length}</p>
            </div>
          </div>
        </div>
      </section>

      {resultados.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <ClipboardList className="h-7 w-7 text-slate-400" />
          </div>
          <p className="font-bold text-slate-600">Aun no tienes evaluaciones</p>
          <p className="mt-1 text-sm text-slate-400">
            Los alumnos podran evaluarte cuando el periodo este activo.
          </p>
        </div>
      )}

      {resultados.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
                Vista por Materia
              </div>
              <h2 className="mt-3 text-xl font-black text-slate-800">
                Resultados resumidos por asignatura
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Cada tarjeta muestra el promedio global y el comportamiento por seccion para cada
                materia evaluada en el periodo actual.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {resultados.map(({ subject, n, facAvg, habAvg, medAvg, globalAvg, nivel, nivelColor }) => (
              <div
                key={subject.id}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_24px_50px_-28px_rgba(16,185,129,0.18)]"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-mono font-bold text-slate-500">
                        {subject.code}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700">
                        {n} eval.
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black leading-tight text-slate-800">
                      {subject.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {n} evaluacion{n !== 1 ? "es" : ""} recibida{n !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-800">{globalAvg}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                        NIVEL_BADGE[nivelColor] ?? "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {nivel}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  {[
                    { label: "Facilitador", valor: facAvg, max: 4, color: "bg-blue-500" },
                    { label: "Habilidades", valor: habAvg, max: 5, color: "bg-indigo-500" },
                    { label: "Medios Did.", valor: medAvg, max: 5, color: "bg-violet-500" },
                  ].map(({ label, valor, max, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="w-24 flex-shrink-0 text-xs font-semibold text-slate-500">
                        {label}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200/70">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{ width: `${(valor / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs font-bold text-slate-500">
                        {valor}
                        <span className="text-slate-300">/{max}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/docente/resultados/${subject.id}`}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-600"
                >
                  Ver detalle por item
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
