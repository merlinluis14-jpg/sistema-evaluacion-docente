// Detalle de resultados por materia — promedios por ítem del FDA-24.5

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import GraficasDetalle from "@/app/admin/reportes/[teacherId]/GraficasDetalle";

export const dynamic = "force-dynamic";

const NIVEL_BADGE: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue:    "bg-blue-100 text-blue-700",
  amber:   "bg-amber-100 text-amber-700",
  red:     "bg-red-100 text-red-700",
};

export default async function ResultadosMateriaPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const session = await getServerSession(authOptions);

  const teacher = await prisma.teacher.findFirst({
    where: { user: { email: session!.user.email! } },
    include: { career: true },
  });
  if (!teacher) redirect("/docente");

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });
  if (!subject) notFound();

  // Verificar que la materia pertenece al docente que está consultando
  if (subject.teacherId !== teacher.id) redirect("/docente");

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

  const n = evaluaciones.length;

  if (n === 0) {
    return (
      <div className="space-y-6">
        <Link href="/docente" className="text-sm text-slate-400 hover:text-slate-600 font-medium">
          ← Volver a Mis Resultados
        </Link>
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-bold text-slate-600">Sin evaluaciones para esta materia</p>
          <p className="text-sm text-slate-400 mt-1">
            Aún no hay alumnos que hayan evaluado {subject.name} en el periodo activo.
          </p>
        </div>
      </div>
    );
  }

  // Calcular promedio por ítem
  const avg = (key: keyof typeof evaluaciones[0]) => {
    const valores = evaluaciones
      .map(e => Number(e[key]) || 0)
      .filter(v => v > 0);
    return valores.length > 0
      ? parseFloat((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2))
      : 0;
  };

  const facilitador = [
    { label: "Orientó sobre unidades al inicio", valor: avg("fac_item01"), max: 4 },
    { label: "Domina los contenidos", valor: avg("fac_item02"), max: 4 },
    { label: "Resumió temas por sesión", valor: avg("fac_item03"), max: 4 },
    { label: "Resumió temas por unidad", valor: avg("fac_item04"), max: 4 },
    { label: "Aclaró dudas", valor: avg("fac_item05"), max: 4 },
    { label: "Impartió asesorías", valor: avg("fac_item06"), max: 4 },
    { label: "Entregó resultados oportunamente", valor: avg("fac_item07"), max: 4 },
    { label: "Logró objetivos del cuatrimestre", valor: avg("fac_item08"), max: 4 },
    { label: "Promovió respeto y disciplina", valor: avg("fac_item09"), max: 4 },
    { label: "Puntualidad del facilitador", valor: avg("fac_item10"), max: 4 },
    { label: "Puntualidad del alumno (manejo)", valor: avg("fac_item11"), max: 4 },
  ];

  const habilidades = [
    { label: "Manejo del lenguaje apropiado", valor: avg("hab_item01"), max: 5 },
    { label: "Conducción al desarrollo profesional", valor: avg("hab_item02"), max: 5 },
    { label: "Capacidad para captar atención", valor: avg("hab_item03"), max: 5 },
    { label: "Relación con competencias del modelo", valor: avg("hab_item04"), max: 5 },
  ];

  const medios = [
    { label: "Pizarrón", valor: avg("med_item01"), max: 5 },
    { label: "TV / Pantalla", valor: avg("med_item02"), max: 5 },
    { label: "Cañón / Proyector", valor: avg("med_item03"), max: 5 },
    { label: "Webquest / Plataformas digitales", valor: avg("med_item04"), max: 5 },
    { label: "Guías de trabajo", valor: avg("med_item05"), max: 5 },
    { label: "Libros y bibliografía", valor: avg("med_item06"), max: 5 },
  ];

  const autoevaluacion = [
    { label: "Participó en clase", valor: avg("auto_item01"), max: 5 },
    { label: "Se ausentó a clases", valor: avg("auto_item02"), max: 5 },
    { label: "Realizó todos los trabajos", valor: avg("auto_item03"), max: 5 },
    { label: "Solicitó asesoría", valor: avg("auto_item04"), max: 5 },
    { label: "Aplicó técnicas de autoestudio", valor: avg("auto_item05"), max: 5 },
    { label: "Realizó investigación extra", valor: avg("auto_item06"), max: 5 },
    { label: "Asistió con material necesario", valor: avg("auto_item07"), max: 5 },
    { label: "Se preparó para exámenes", valor: avg("auto_item08"), max: 5 },
    { label: "Puso en práctica conocimientos", valor: avg("auto_item09"), max: 5 },
    { label: "Mantuvo atención en clase", valor: avg("auto_item10"), max: 5 },
    { label: "Desarrolló competencias", valor: avg("auto_item11"), max: 5 },
  ];

  const promedioFac  = parseFloat((facilitador.reduce((a, i) => a + i.valor, 0) / facilitador.length).toFixed(2));
  const promedioHab  = parseFloat((habilidades.reduce((a, i) => a + i.valor, 0) / habilidades.length).toFixed(2));
  const promedioMed  = parseFloat((medios.reduce((a, i) => a + i.valor, 0) / medios.length).toFixed(2));
  const promedioAuto = parseFloat((autoevaluacion.reduce((a, i) => a + i.valor, 0) / autoevaluacion.length).toFixed(2));
  const promedioGlobal = parseFloat(((promedioFac + promedioHab + promedioMed) / 3).toFixed(2));

  const nivel = promedioGlobal >= 3.5 ? "Excelente"
    : promedioGlobal >= 2.5 ? "Bueno"
    : promedioGlobal >= 1.5 ? "Regular"
    : "Deficiente";

  const nivelColor = promedioGlobal >= 3.5 ? "emerald"
    : promedioGlobal >= 2.5 ? "blue"
    : promedioGlobal >= 1.5 ? "amber"
    : "red";

  return (
    <div className="space-y-6">

      {/* Navegación */}
      <Link
        href="/docente"
        className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
      >
        ← Volver a Mis Resultados
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Detalle por materia
            </p>
            <h1 className="text-2xl font-black text-slate-800">{subject.name}</h1>
            <p className="text-slate-400 text-sm mt-1">
              {subject.code} · {periodoActivo?.name ?? "Periodo activo"} · {n} evaluación{n !== 1 ? "es" : ""} recibida{n !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-blue-600">{promedioGlobal}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Promedio Global</p>
            <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-bold ${NIVEL_BADGE[nivelColor] ?? "bg-slate-100 text-slate-700"}`}>
              {nivel}
            </span>
          </div>
        </div>
      </div>

      {/* Aviso de anonimato */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 flex items-center gap-3">
        <span className="text-blue-500">🔒</span>
        <p className="text-sm text-blue-700">
          Estos resultados son <strong>anónimos</strong>. Los promedios representan
          al grupo completo — no puedes identificar a alumnos individuales.
        </p>
      </div>

      {/* Gráficas — reutiliza el componente del admin */}
      <GraficasDetalle
        facilitador={facilitador}
        habilidades={habilidades}
        medios={medios}
        autoevaluacion={autoevaluacion}
        promedios={{
          fac:  promedioFac,
          hab:  promedioHab,
          med:  promedioMed,
          auto: promedioAuto,
        }}
      />

    </div>
  );
}
