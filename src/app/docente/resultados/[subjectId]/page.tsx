import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BarChart3, BookOpen, ClipboardList, ShieldCheck } from "lucide-react";

import GraficasDetalle from "@/app/admin/reportes/[teacherId]/GraficasDetalle";
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

export default async function ResultadosMateriaPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const session = await getServerSession(authOptions);

  const teacher = await prisma.teacher.findFirst({
    where: { user: { id: session!.user.id! } },
    include: { career: true },
  });

  if (!teacher) {
    redirect("/docente");
  }

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });

  if (!subject) {
    notFound();
  }

  if (subject.teacherId !== teacher.id) {
    redirect("/docente");
  }

  const periodoActivo = await prisma.period.findFirst({
    where: { isActive: true },
  });

  const evaluaciones = await prisma.evaluation.findMany({
    where: {
      teacherId: teacher.id,
      subjectId,
      ...(periodoActivo ? { periodId: periodoActivo.id } : {}),
    },
  });

  const totalEvaluaciones = evaluaciones.length;

  if (totalEvaluaciones === 0) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <Link
          href="/docente/resultados"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Mis Resultados
        </Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <ClipboardList className="h-7 w-7 text-slate-400" />
          </div>
          <p className="font-bold text-slate-600">Sin evaluaciones para esta materia</p>
          <p className="mt-1 text-sm text-slate-400">
            Aún no hay alumnos que hayan evaluado {subject.name} en el período activo.
          </p>
        </div>
      </div>
    );
  }

  const studentReport = buildStudentReport(evaluaciones);
  const {
    facilitador,
    habilidades,
    medios,
    autoevaluacion,
    teoriaPractica,
    promedios: {
      fac: promedioFac,
      hab: promedioHab,
      med: promedioMed,
      auto: promedioAuto,
      global: promedioGlobal,
    },
  } = studentReport;

  const nivel = getPerformanceLevel(promedioGlobal);
  const nivelColor = getPerformanceLevelColor(promedioGlobal);

  return (
    <div className="relative space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-x-6 top-4 -z-10 h-72 rounded-[2rem] bg-gradient-to-b from-blue-50/70 via-slate-50 to-transparent blur-2xl sm:inset-x-10" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/docente/resultados"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Mis Resultados
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-24 w-24 rounded-full bg-indigo-100/60 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              <BookOpen className="h-3.5 w-3.5 text-blue-600" />
              Detalle por Materia
            </div>

            <h1 className="mt-4 text-2xl font-black text-slate-800 sm:text-3xl">{subject.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {subject.code} · {periodoActivo?.name ?? "Período activo"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {totalEvaluaciones} evaluación{totalEvaluaciones !== 1 ? "es" : ""} recibida
                {totalEvaluaciones !== 1 ? "s" : ""}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {teacher.career.code}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Promedio Global</span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-800">{promedioGlobal}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Resultado</span>
              </div>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  NIVEL_BADGE[nivelColor] ?? "bg-slate-100 text-slate-700"
                }`}
              >
                {nivel}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span className="text-[11px] font-black uppercase tracking-wide">Anonimato</span>
              </div>
              <p className="mt-2 text-sm font-bold text-slate-700">Respuestas protegidas</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-blue-100 bg-blue-50/80 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-blue-900">Lectura del reporte</h2>
            <p className="mt-1 text-sm text-blue-700">
              Estos resultados son anónimos. Los promedios representan al grupo completo y pueden
              usarse como evidencia para retroalimentación y mejora docente.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.18)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm">
              <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
              Resumen de la Materia
            </div>
            <h2 className="mt-3 text-xl font-black text-slate-800">
              Síntesis general antes del desglose por reactivo
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Este bloque muestra la lectura compacta del resultado obtenido en la materia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Facilitador", valor: promedioFac, max: 4, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
            { label: "Habilidades", valor: promedioHab, max: 5, color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-100" },
            { label: "Medios Did.", valor: promedioMed, max: 5, color: "text-violet-700", bg: "bg-violet-50 border-violet-100" },
            { label: "Autoevaluac.", valor: promedioAuto, max: 5, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
          ].map(({ label, valor, max, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-4 text-center shadow-sm ${bg}`}>
              <p className={`text-2xl font-black ${color}`}>{valor}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                /{max} · {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
              Análisis Gráfico
            </div>
            <h2 className="mt-3 text-xl font-black text-slate-800">
              Desglose visual por sección y reactivo
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Aquí puedes revisar con mayor detalle el comportamiento de cada dimensión evaluada.
            </p>
          </div>
        </div>

        <GraficasDetalle
          facilitador={facilitador}
          habilidades={habilidades}
          medios={medios}
          autoevaluacion={autoevaluacion}
          teoriaPractica={teoriaPractica}
          showSectionSummary={false}
          promedios={{
            fac: promedioFac,
            hab: promedioHab,
            med: promedioMed,
            auto: promedioAuto,
          }}
        />
      </section>
    </div>
  );
}
