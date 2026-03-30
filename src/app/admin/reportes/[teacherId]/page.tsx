// src/app/admin/reportes/[teacherId]/page.tsx
// Detalle de evaluación por docente — promedios por ítem FDA-24.5
// RF8: Reporte individual exportable | RF9: Estadísticas gráficas

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import GraficasDetalle from "./GraficasDetalle";
import ExportTeacherPdf from "./ExportTeacherPdf";
import CareerHeadEvaluationForm from "./CareerHeadEvaluationForm";
import { buildStudentReport, getPerformanceLevel, getTeacherPositionLabel } from "@/lib/reportes";
import { Target, Lightbulb, Monitor, ClipboardCheck, Inbox, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

// Mapa estático de clases para tarjetas de sección
const COLOR_CARD: Record<string, { bg: string; border: string; icon: string; value: string; label: string }> = {
  blue:    { bg: "bg-[#1B2A6B]/5",    border: "border-[#1B2A6B]/10",    icon: "text-[#1B2A6B]",    value: "text-[#1B2A6B]",    label: "text-[#7A7468]" },
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-100",  icon: "text-indigo-500",  value: "text-indigo-700",  label: "text-indigo-400" },
  violet:  { bg: "bg-violet-50",  border: "border-violet-100",  icon: "text-violet-500",  value: "text-violet-700",  label: "text-violet-400" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-500", value: "text-emerald-700", label: "text-emerald-400" },
};

export default async function ReporteDocenteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<{ periodoId?: string }>;
}) {
  const { teacherId } = await params;
  const { periodoId: periodoIdParam } = await searchParams;

  // Buscar docente
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { career: true },
  });
  if (!teacher) notFound();

  // Periodo
  const periodoActivo = await prisma.period.findFirst({ where: { isActive: true } });
  const periodoId = periodoIdParam ?? periodoActivo?.id;

  const periodo = periodoId
    ? await prisma.period.findUnique({ where: { id: periodoId } })
    : periodoActivo;

  const careerHeadEvaluation = periodoId
    ? await prisma.careerHeadEvaluation.findUnique({
      where: {
        teacherId_periodId: {
          teacherId,
          periodId: periodoId,
        },
      },
    })
    : null;

  // Evaluaciones del docente en el periodo
  const evaluaciones = await prisma.evaluation.findMany({
    where: {
      teacherId: teacherId,
      ...(periodoId ? { periodId: periodoId } : {}),
    },
    include: { subject: true },
  });

  if (evaluaciones.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Link href="/admin/reportes" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600">
          <ArrowLeft size={15} /> Volver a Reportes
        </Link>
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <Inbox className="w-12 h-12 mb-3 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-600">Sin evaluaciones registradas</p>
          <p className="text-sm text-slate-400 mt-1">
            {teacher.name} {teacher.lastName} no tiene evaluaciones en este periodo.
          </p>
        </div>
      </div>
    );
  }

  const n = evaluaciones.length;
  const {
    facilitador,
    habilidades,
    medios,
    autoevaluacion,
    promedios: {
      fac: promedioFac,
      hab: promedioHab,
      med: promedioMed,
      auto: promedioAuto,
      global: promedioGlobal,
    },
  } = buildStudentReport(evaluaciones);
  const nivel = getPerformanceLevel(promedioGlobal);

  // Materias evaluadas
  const materias = [...new Map(evaluaciones.map(e => [e.subjectId, e.subject])).values()];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

      {/* Navegación y Exportación */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href={`/admin/reportes${periodoId ? `?periodoId=${periodoId}` : ""}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
        >
          <ArrowLeft size={15} /> Volver a Reportes
        </Link>

        {/* Botón de Exportación Individual Oficial */}
        <ExportTeacherPdf 
          teacher={teacher}
          periodo={periodo?.name ?? "Histórico Total"}
          evaluacionesCount={n}
          promedios={{ fac: promedioFac, hab: promedioHab, med: promedioMed, auto: promedioAuto, global: promedioGlobal }}
          nivel={nivel}
          facilitador={facilitador}
          habilidades={habilidades}
          medios={medios}
          autoevaluacion={autoevaluacion}
        />
      </div>

      {/* Datos del Docente */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#1B2A6B] to-[#2A3F9F] rounded-2xl flex items-center justify-center text-white text-xl font-black">
              {teacher.name[0]}{teacher.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">
                {teacher.name} {teacher.lastName}
              </h1>
              <p className="text-slate-400 text-sm">
                {teacher.career.name} · {teacher.employeeId}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {getTeacherPositionLabel(teacher.position)}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {periodo?.name} · {n} evaluación{n !== 1 ? "es" : ""} recibida{n !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {/* Nivel global */}
          <div className="text-center">
            <p className="text-4xl font-black text-[#1B2A6B]">{promedioGlobal}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Promedio Global</p>
            <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-bold ${nivel === "Excelente" ? "bg-emerald-100 text-emerald-700"
                : nivel === "Bueno" ? "bg-blue-100 text-[#1B2A6B]"
                  : nivel === "Regular" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
              }`}>
              {nivel}
            </span>
          </div>
        </div>
      </div>

      {/* Resumen por Sección */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Facilitador",  valor: promedioFac,  max: 4, color: "blue",    Icon: Target         },
          { label: "Habilidades",  valor: promedioHab,  max: 5, color: "indigo",  Icon: Lightbulb      },
          { label: "Medios Did.",  valor: promedioMed,  max: 5, color: "violet",  Icon: Monitor        },
          { label: "Autoevaluac.",valor: promedioAuto, max: 5, color: "emerald", Icon: ClipboardCheck },
        ].map(({ label, valor, max, color, Icon }) => {
          const c = COLOR_CARD[color];
          return (
            <div key={label} className={`${c.bg} border ${c.border} rounded-2xl p-4 text-center`}>
              <Icon className={`w-5 h-5 mb-1 mx-auto ${c.icon}`} />
              <p className={`text-2xl font-black ${c.value}`}>{valor}</p>
              <p className={`text-xs ${c.label} font-bold`}>/{max} — {label}</p>
            </div>
          );
        })}
      </div>

      {/* Lista de Materias Evaluadas */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-bold text-slate-700 mb-3 text-sm">Materias evaluadas</h3>
        <div className="flex flex-wrap gap-2">
          {materias.map(m => (
            <span key={m.id} className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl">
              {m.code} — {m.name}
            </span>
          ))}
        </div>
      </div>

      <CareerHeadEvaluationForm
        teacherId={teacher.id}
        teacherName={`${teacher.name} ${teacher.lastName}`}
        periodId={periodoId}
        periodName={periodo?.name ?? "Sin periodo"}
        position={teacher.position}
        initialEvaluation={careerHeadEvaluation}
      />

      {/* Visualización Gráfica */}
      <GraficasDetalle
        facilitador={facilitador}
        habilidades={habilidades}
        medios={medios}
        autoevaluacion={autoevaluacion}
        promedios={{
          fac: promedioFac,
          hab: promedioHab,
          med: promedioMed,
          auto: promedioAuto,
        }}
      />

    </div>
  );
}
