"use client";
/**
 * Detail chart components (Client Component)
 * Renders horizontal bar charts per item and a progress-bar summary per section.
 * No external chart libraries — pure CSS with Tailwind.
 * Cumple con: RF9
 */

type Item = { label: string; valor: number; max: number };

type Props = {
  facilitador:    Item[];
  habilidades:    Item[];
  medios:         Item[];
  autoevaluacion: Item[];
  promedios: {
    fac:  number;
    hab:  number;
    med:  number;
    auto: number;
  };
};

const COLOR_MAP = {
  blue:    { bg: "bg-blue-100",    fill: "bg-blue-500",    text: "text-blue-700",    header: "bg-blue-600" },
  indigo:  { bg: "bg-indigo-100",  fill: "bg-indigo-500",  text: "text-indigo-700",  header: "bg-indigo-600" },
  violet:  { bg: "bg-violet-100",  fill: "bg-violet-500",  text: "text-violet-700",  header: "bg-violet-600" },
  emerald: { bg: "bg-emerald-100", fill: "bg-emerald-500", text: "text-emerald-700", header: "bg-emerald-600" },
} as const;

type ColorKey = keyof typeof COLOR_MAP;

function BarraItem({ label, valor, max, color, index }: {
  label: string; valor: number; max: number; color: ColorKey; index: number;
}) {
  const pct = max > 0 ? (valor / max) * 100 : 0;
  const c = COLOR_MAP[color];

  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs text-slate-300 font-bold w-5 text-right flex-shrink-0">
        {index + 1}
      </span>
      <p className="text-xs text-slate-600 w-52 flex-shrink-0 leading-tight group-hover:text-slate-800 transition-colors">
        {label}
      </p>
      <div className={`flex-1 h-5 ${c.bg} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${c.fill} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-black ${c.text} w-14 text-right flex-shrink-0`}>
        {valor} <span className="font-normal text-slate-400">/{max}</span>
      </span>
    </div>
  );
}

function SeccionGrafica({ titulo, subtitulo, items, color, promedio, max }: {
  titulo: string; subtitulo: string; items: Item[];
  color: ColorKey; promedio: number; max: number;
}) {
  const c = COLOR_MAP[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`${c.header} px-6 py-4 flex items-center justify-between`}>
        <div>
          <h3 className="font-black text-white">{titulo}</h3>
          <p className="text-white/60 text-xs mt-0.5">{subtitulo}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">{promedio}</p>
          <p className="text-white/60 text-xs">/{max} promedio</p>
        </div>
      </div>
      <div className="p-6 space-y-3">
        {items.map((item, idx) => (
          <BarraItem key={idx} label={item.label} valor={item.valor} max={item.max} color={color} index={idx} />
        ))}
      </div>
    </div>
  );
}

function ResumenSecciones({ promedios }: { promedios: Props["promedios"] }) {
  const secciones: { label: string; valor: number; max: number; color: ColorKey }[] = [
    { label: "Facilitador",  valor: promedios.fac,  max: 4, color: "blue"    },
    { label: "Habilidades",  valor: promedios.hab,  max: 5, color: "indigo"  },
    { label: "Medios Did.",  valor: promedios.med,  max: 5, color: "violet"  },
    { label: "Autoevaluac.", valor: promedios.auto, max: 5, color: "emerald" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
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

export default function GraficasDetalle({ facilitador, habilidades, medios, autoevaluacion, promedios }: Props) {
  return (
    <div className="space-y-6">
      <ResumenSecciones promedios={promedios} />
      <SeccionGrafica
        titulo="Sección 1 — Evaluación del Facilitador"
        subtitulo="11 ítems · Escala E/MB/B/M (1-4)"
        items={facilitador} color="blue" promedio={promedios.fac} max={4}
      />
      <SeccionGrafica
        titulo="Sección 2 — Habilidades del Facilitador"
        subtitulo="4 ítems · Escala E/MB/B/R/M (1-5)"
        items={habilidades} color="indigo" promedio={promedios.hab} max={5}
      />
      <SeccionGrafica
        titulo="Sección 3 — Medios Didácticos"
        subtitulo="6 ítems · Frecuencia de uso (1-5)"
        items={medios} color="violet" promedio={promedios.med} max={5}
      />
      <SeccionGrafica
        titulo="Sección 5 — Autoevaluación del Alumno"
        subtitulo="11 ítems · Frecuencia (1-5)"
        items={autoevaluacion} color="emerald" promedio={promedios.auto} max={5}
      />
    </div>
  );
}
