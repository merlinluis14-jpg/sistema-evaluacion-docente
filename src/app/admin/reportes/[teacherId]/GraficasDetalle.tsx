"use client";

import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { Radar } from "react-chartjs-2";

import type { TheoryPracticeSummary } from "@/lib/reportes";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type Item = { label: string; valor: number; max: number };

type Props = {
  facilitador: Item[];
  habilidades: Item[];
  medios: Item[];
  autoevaluacion: Item[];
  teoriaPractica: TheoryPracticeSummary;
  showSectionSummary?: boolean;
  promedios: {
    fac: number;
    hab: number;
    med: number;
    auto: number;
  };
};

const COLOR_MAP = {
  blue: { bg: "bg-blue-100", fill: "bg-blue-500", text: "text-blue-700", header: "bg-blue-600" },
  indigo: { bg: "bg-indigo-100", fill: "bg-indigo-500", text: "text-indigo-700", header: "bg-indigo-600" },
  violet: { bg: "bg-violet-100", fill: "bg-violet-500", text: "text-violet-700", header: "bg-violet-600" },
  emerald: { bg: "bg-emerald-100", fill: "bg-emerald-500", text: "text-emerald-700", header: "bg-emerald-600" },
  amber: { bg: "bg-amber-100", fill: "bg-amber-500", text: "text-amber-700", header: "bg-amber-500" },
} as const;

type ColorKey = keyof typeof COLOR_MAP;

function BarraItem({ label, valor, max, color, index }: {
  label: string;
  valor: number;
  max: number;
  color: ColorKey;
  index: number;
}) {
  const pct = max > 0 ? (valor / max) * 100 : 0;
  const c = COLOR_MAP[color];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto,minmax(0,1fr),minmax(0,1fr),auto] sm:items-center sm:gap-3 group">
      <span className="text-xs text-slate-300 font-bold w-5 text-left sm:text-right flex-shrink-0">
        {index + 1}
      </span>
      <p className="text-xs text-slate-600 leading-tight group-hover:text-slate-800 transition-colors sm:max-w-xs">
        {label}
      </p>
      <div className={`flex-1 h-5 ${c.bg} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${c.fill} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-black ${c.text} text-left sm:w-14 sm:text-right flex-shrink-0`}>
        {valor} <span className="font-normal text-slate-400">/{max}</span>
      </span>
    </div>
  );
}

function SeccionGrafica({ titulo, subtitulo, items, color, promedio, max }: {
  titulo: string;
  subtitulo: string;
  items: Item[];
  color: ColorKey;
  promedio: number;
  max: number;
}) {
  const c = COLOR_MAP[color];

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.18)]">
      <div className={`${c.header} px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h3 className="font-black text-white">{titulo}</h3>
          <p className="text-white/60 text-xs mt-0.5">{subtitulo}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl font-black text-white">{promedio}</p>
          <p className="text-white/60 text-xs">/{max} promedio</p>
        </div>
      </div>
      <div className="p-4 sm:p-6 space-y-3">
        {items.map((item, idx) => (
          <BarraItem key={`${titulo}-${idx}`} label={item.label} valor={item.valor} max={item.max} color={color} index={idx} />
        ))}
      </div>
    </div>
  );
}

function ResumenSecciones({ promedios }: { promedios: Props["promedios"] }) {
  const secciones: { label: string; valor: number; max: number; color: ColorKey }[] = [
    { label: "Facilitador", valor: promedios.fac, max: 4, color: "blue" },
    { label: "Habilidades", valor: promedios.hab, max: 5, color: "indigo" },
    { label: "Medios Did.", valor: promedios.med, max: 5, color: "violet" },
    { label: "Autoevaluac.", valor: promedios.auto, max: 5, color: "emerald" },
  ];

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.18)] p-4 sm:p-6">
      <h3 className="font-black text-slate-700 mb-4">Resumen por Sección</h3>
      <div className="space-y-4">
        {secciones.map(({ label, valor, max, color }) => {
          const pct = max > 0 ? (valor / max) * 100 : 0;
          const c = COLOR_MAP[color];
          return (
            <div key={label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-slate-600">{label}</span>
                <span className={`text-sm font-black ${c.text}`}>
                  {valor} <span className="text-slate-400 font-normal text-xs">/{max}</span>
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${c.fill} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-300 mt-0.5">
                <span>0</span>
                <span className="font-medium text-slate-400">{Math.round(pct)}%</span>
                <span>{max}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RadarSecciones({ promedios }: { promedios: Props["promedios"] }) {
  const facPct = (promedios.fac / 4) * 100;
  const habPct = (promedios.hab / 5) * 100;
  const medPct = (promedios.med / 5) * 100;
  const autoPct = (promedios.auto / 5) * 100;

  const data = {
    labels: ["Facilitador", "Habilidades", "Medios Didácticos", "Autoevaluación"],
    datasets: [
      {
        label: "Porcentaje por sección",
        data: [facPct, habPct, medPct, autoPct],
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        borderColor: "rgba(59, 130, 246, 0.8)",
        borderWidth: 2,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          stepSize: 20,
          font: { size: 10 },
          color: "#94a3b8",
          backdropColor: "transparent",
        },
        grid: {
          color: "rgba(148, 163, 184, 0.15)",
        },
        angleLines: {
          color: "rgba(148, 163, 184, 0.2)",
        },
        pointLabels: {
          font: { size: 12, weight: 700 as const },
          color: "#334155",
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => `${Math.round(ctx.raw as number)}%`,
        },
      },
    },
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/70 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.18)] sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="mb-1 font-black text-slate-700">Gráfica radar por sección</h3>
          <p className="text-xs text-slate-400">
            Valores normalizados a porcentaje para comparar secciones con distintas escalas
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm">
          Vista comparativa
        </span>
      </div>
      <p className="sr-only">
        Valores normalizados a porcentaje para comparar secciones con distintas escalas
      </p>
      <div className="max-w-md mx-auto w-full">
        <Radar data={data} options={options} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Facilitador", pct: facPct, raw: promedios.fac, max: 4, color: "blue" as ColorKey },
          { label: "Habilidades", pct: habPct, raw: promedios.hab, max: 5, color: "indigo" as ColorKey },
          { label: "Medios Did.", pct: medPct, raw: promedios.med, max: 5, color: "violet" as ColorKey },
          { label: "Autoevaluac.", pct: autoPct, raw: promedios.auto, max: 5, color: "emerald" as ColorKey },
        ].map(({ label, pct, raw, max, color }) => {
          const c = COLOR_MAP[color];
          return (
            <div key={label} className={`rounded-xl p-2 text-center ${c.bg}`}>
              <p className={`text-lg font-black ${c.text}`}>{Math.round(pct)}%</p>
              <p className={`text-[10px] font-bold ${c.text} opacity-70`}>{raw}/{max} - {label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TheoryPracticeSection({ theoryPractice }: { theoryPractice: TheoryPracticeSummary }) {
  const c = COLOR_MAP.amber;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.18)]">
      <div className={`${c.header} px-4 sm:px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h3 className="font-black text-white">Sección 4 - Relación teoría / práctica</h3>
          <p className="text-white/70 text-xs mt-0.5">
            Respuesta categorica del instrumento FDA-24.5. Se reporta aparte y no altera el promedio global.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm font-black text-white">
            {theoryPractice.predominant?.label ?? "Sin respuestas"}
          </p>
          <p className="text-white/70 text-xs">{theoryPractice.totalResponses} respuestas validas</p>
        </div>
      </div>
      <div className="p-4 sm:p-6 space-y-3">
        {theoryPractice.items.map((item, index) => (
          <div key={item.value} className="grid grid-cols-1 gap-2 sm:grid-cols-[auto,minmax(0,1fr),minmax(0,1fr),auto] sm:items-center sm:gap-3">
            <span className="text-xs text-slate-300 font-bold w-5 text-left sm:text-right flex-shrink-0">
              {index + 1}
            </span>
            <p className="text-xs text-slate-600 leading-tight sm:max-w-xs">{item.label}</p>
            <div className={`flex-1 h-5 ${c.bg} rounded-full overflow-hidden`}>
              <div
                className={`h-full ${c.fill} rounded-full transition-all duration-700`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <span className={`text-xs font-black ${c.text} text-left sm:w-24 sm:text-right flex-shrink-0`}>
              {item.count} <span className="font-normal text-slate-400">({Math.round(item.percentage)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GraficasDetalle({
  facilitador,
  habilidades,
  medios,
  autoevaluacion,
  teoriaPractica,
  showSectionSummary = true,
  promedios,
}: Props) {
  return (
    <div className="space-y-5">
      {showSectionSummary && <ResumenSecciones promedios={promedios} />}
      <RadarSecciones promedios={promedios} />
      <SeccionGrafica
        titulo="Sección 1 - Evaluación del Facilitador"
        subtitulo="11 items - Escala E/MB/B/M (1-4)"
        items={facilitador}
        color="blue"
        promedio={promedios.fac}
        max={4}
      />
      <SeccionGrafica
        titulo="Sección 2 - Habilidades del Facilitador"
        subtitulo="4 items - Escala E/MB/B/R/M (1-5)"
        items={habilidades}
        color="indigo"
        promedio={promedios.hab}
        max={5}
      />
      <SeccionGrafica
        titulo="Sección 3 - Medios Didácticos"
        subtitulo="6 items - Frecuencia de uso (1-5)"
        items={medios}
        color="violet"
        promedio={promedios.med}
        max={5}
      />
      <TheoryPracticeSection theoryPractice={teoriaPractica} />
      <SeccionGrafica
        titulo="Sección 5 - Autoevaluación del Alumno"
        subtitulo="11 items - Frecuencia (1-5)"
        items={autoevaluacion}
        color="emerald"
        promedio={promedios.auto}
        max={5}
      />
    </div>
  );
}
