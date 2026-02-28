"use client";

import { useState } from "react";

// ============================================================
// CONSTANTES DE ESCALA
// ============================================================
const SCALE_EMBM = [
    { value: 4, label: "E", full: "Excelente" },
    { value: 3, label: "MB", full: "Muy Bien" },
    { value: 2, label: "B", full: "Bien" },
    { value: 1, label: "M", full: "Malo" },
];

// FIX: "R" (Regular) usa value=2 al igual que "B" en el instrumento original,
// ya que el FDA-24.5 asigna el mismo peso numérico. Se mantiene la distinción
// visual para que el alumno comprenda la escala, pero ambos envían el valor 2.
const SCALE_EMBM_HAB = [
    { value: 4, label: "E", full: "Excelente" },
    { value: 3, label: "MB", full: "Muy Bien" },
    { value: 2, label: "B", full: "Bien" },
    { value: 2, label: "R", full: "Regular" },
    { value: 1, label: "M", full: "Malo" },
];

const SCALE_FREQ = [
    { value: 5, label: "Siempre", full: "Siempre" },
    { value: 4, label: "1-3/sem", full: "De 1 a 3 veces por semana" },
    { value: 3, label: "1-3/mes", full: "De 1 a 3 veces por mes" },
    { value: 2, label: "1-3/cuat", full: "De 1 a 3 veces por cuatrimestre" },
    { value: 1, label: "Nunca", full: "Nunca" },
];

const SCALE_TP = [
    { value: 1, label: "De acuerdo a la naturaleza de la asignatura, el curso estuvo bien" },
    { value: 2, label: "Buena combinación de teoría y práctica" },
    { value: 3, label: "Demasiada teoría y poca práctica" },
    { value: 4, label: "Poca teoría y mucha práctica" },
    { value: 5, label: "Poca teoría y poca práctica" },
];

// ============================================================
// ÍTEMS DEL FDA-24.5
// ============================================================
const SEC1 = [
    { name: "fac_item01", label: "Al inicio del cuatrimestre orientó sobre las unidades de aprendizaje, objetivos, resultados esperados, competencias, habilidades y referencias bibliográficas." },
    { name: "fac_item02", label: "Domina los contenidos de las unidades." },
    { name: "fac_item03", label: "Resumió el tema al final de cada sesión." },
    { name: "fac_item04", label: "Resumió los temas al final de cada unidad." },
    { name: "fac_item05", label: "Aclaró dudas." },
    { name: "fac_item06", label: "Impartió asesorías." },
    { name: "fac_item07", label: "Entregó los resultados del examen oportunamente." },
    { name: "fac_item08", label: "Logró los objetivos del cuatrimestre (aprendiste en la materia)." },
    { name: "fac_item09", label: "Promovió un ambiente de respeto y disciplina." },
    { name: "fac_item10", label: "La puntualidad del FACILITADOR y manejo del tiempo en clase." },
    { name: "fac_item11", label: "La puntualidad del ALUMNO y manejo de la situación por el profesor." },
];

const SEC2 = [
    { name: "hab_item01", label: "Manejo del lenguaje apropiado de la asignatura." },
    { name: "hab_item02", label: "Conducción a los alumnos al desarrollo profesional." },
    { name: "hab_item03", label: "Capacidad del facilitador para captar la atención del grupo." },
    { name: "hab_item04", label: "Relación de los contenidos de la materia con las competencias del modelo educativo." },
];

const SEC3 = [
    { name: "med_item01", label: "Pizarrón" },
    { name: "med_item02", label: "TV" },
    { name: "med_item03", label: "Cañón" },
    { name: "med_item04", label: "Webquest (guía electrónica en internet orientada por el facilitador)" },
    { name: "med_item05", label: "Guías de trabajo" },
    { name: "med_item06", label: "Libros" },
];

const SEC5 = [
    { name: "auto_item01", label: "¿Participé en clase?" },
    { name: "auto_item02", label: "¿Falté a alguna clase?" },
    { name: "auto_item03", label: "¿Realicé todos los trabajos y tareas encomendados por el profesor?" },
    { name: "auto_item04", label: "¿Solicité asesoría del profesor?" },
    { name: "auto_item05", label: "¿Apliqué técnicas de autoestudio?" },
    { name: "auto_item06", label: "¿Realicé investigación para ampliar el contenido de los temas?" },
    { name: "auto_item07", label: "¿Me presenté a clases con el material necesario?" },
    { name: "auto_item08", label: "¿Me preparé continuamente para presentar exámenes?" },
    { name: "auto_item09", label: "Puse en práctica los conocimientos adquiridos." },
    { name: "auto_item10", label: "¿Presté en cada clase atención y disposición para el aprendizaje?" },
    { name: "auto_item11", label: "Desarrollo de las competencias." },
];

// ============================================================
// SUB-COMPONENTES (con clases explícitas para Tailwind JIT)
// ============================================================

type ScaleOption = { value: number; label: string; full: string };

function ScaleRow({
    name, label, itemNumber, scale, accentBg, accentAccent,
}: {
    name: string; label: string; itemNumber: number;
    scale: ScaleOption[]; accentBg: string; accentAccent: string;
}) {
    return (
        <div className="group flex flex-col gap-3 p-5 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full ${accentBg} text-white text-xs font-black flex items-center justify-center`}>
                    {itemNumber}
                </span>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{label}</p>
            </div>
            <div className="flex gap-3 justify-end flex-wrap">
                {scale.map((opt, idx) => (
                    <label key={idx} className="flex flex-col items-center gap-1 cursor-pointer">
                        <input type="radio" name={name} value={opt.value} required
                            className={`w-4 h-4 cursor-pointer ${accentAccent}`} />
                        <span className="text-[11px] font-black text-slate-400 group-hover:text-slate-600" title={opt.full}>
                            {opt.label}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}

function FreqRow({
    name, label, itemNumber, accentBg,
}: {
    name: string; label: string; itemNumber: number; accentBg: string;
}) {
    return (
        <div className="grid grid-cols-[auto_1fr] gap-x-4 items-center p-4 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all duration-200">
            <span className={`w-7 h-7 rounded-full ${accentBg} text-white text-xs font-black flex items-center justify-center flex-shrink-0`}>
                {itemNumber}
            </span>
            <div className="flex flex-col gap-2">
                <p className="text-sm text-slate-700 font-medium leading-snug">{label}</p>
                <div className="flex gap-3 flex-wrap">
                    {SCALE_FREQ.map((opt, idx) => (
                        <label key={idx} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" name={name} value={opt.value} required
                                className="w-4 h-4 cursor-pointer accent-emerald-600" />
                            <span className="text-[11px] font-bold text-slate-400" title={opt.full}>{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

type SectionHeaderProps = {
    stepNum: string; title: string; subtitle: string; badge: string;
    accentBg: string; accentText: string; badgeBg: string; badgeText: string; borderColor: string;
};

function SectionHeader({ stepNum, title, subtitle, badge, accentBg, accentText, badgeBg, badgeText, borderColor }: SectionHeaderProps) {
    return (
        <div className={`bg-white p-8 rounded-3xl shadow-sm border ${borderColor} relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${accentBg}`}></div>
            <div className="flex justify-between items-start mb-3 pl-3">
                <div>
                    <span className={`text-xs font-black tracking-widest uppercase ${accentText}`}>Sección {stepNum}</span>
                    <h2 className="text-xl font-black text-slate-800 mt-0.5">{title}</h2>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ml-4 ${badgeBg} ${badgeText}`}>{badge}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed pl-3">{subtitle}</p>
        </div>
    );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function EvaluationForm({
    subjectId, teacherId, periodId, action,
}: {
    subjectId: string; teacherId: string; periodId: string;
    action: (formData: FormData) => void;
}) {
    const [step, setStep] = useState(1);
    const TOTAL = 5;
    const next = () => setStep(s => Math.min(s + 1, TOTAL));
    const prev = () => setStep(s => Math.max(s - 1, 1));

    const steps = [
        { label: "Facilitador", bg: "bg-blue-600" },
        { label: "Habilidades", bg: "bg-indigo-600" },
        { label: "Medios", bg: "bg-violet-600" },
        { label: "Teoría/Práctica", bg: "bg-amber-500" },
        { label: "Autoevaluación", bg: "bg-emerald-600" },
    ];

    return (
        <form action={action} className="w-full space-y-6 animate-in fade-in duration-500">
            <input type="hidden" name="subjectId" value={subjectId} />
            <input type="hidden" name="teacherId" value={teacherId} />
            <input type="hidden" name="periodId" value={periodId} />

            {/* Aviso de anonimato — RF7 */}
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3">
                <span className="text-lg">🔒</span>
                <p className="text-sm text-blue-700 font-medium">
                    Tu evaluación es <strong>completamente anónima</strong>. El docente no podrá identificarte.
                </p>
            </div>

            {/* Indicador de pasos */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {steps.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${step === idx + 1 ? `${s.bg} text-white shadow-md`
                                : step > idx + 1 ? "bg-slate-200 text-slate-400 line-through"
                                    : "bg-slate-100 text-slate-400"}`}>
                            <span>{idx + 1}</span>
                            <span className="hidden sm:inline">{s.label}</span>
                        </div>
                        {idx < TOTAL - 1 && (
                            <div className={`h-0.5 w-4 rounded-full transition-all ${step > idx + 1 ? "bg-slate-400" : "bg-slate-200"}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* ── PASO 1: Facilitador ──────────────────────────── */}
            {step === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <SectionHeader stepNum="01" title="Evaluación del Facilitador"
                        subtitle="Desempeño general, puntualidad, dominio de contenidos y cumplimiento de objetivos institucionales."
                        badge="11 Ítems" accentBg="bg-blue-600" accentText="text-blue-600"
                        badgeBg="bg-blue-100" badgeText="text-blue-700" borderColor="border-blue-50" />
                    <div className="flex flex-wrap justify-end gap-3 px-2">
                        {SCALE_EMBM.map((s, i) => (
                            <span key={i} className="text-xs text-slate-400 font-bold">
                                <span className="text-slate-700">{s.label}</span> = {s.full}
                            </span>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {SEC1.map((item, idx) => (
                            <ScaleRow key={item.name} name={item.name} label={item.label} itemNumber={idx + 1}
                                scale={SCALE_EMBM} accentBg="bg-blue-600" accentAccent="accent-blue-600" />
                        ))}
                    </div>
                </div>
            )}

            {/* ── PASO 2: Habilidades ──────────────────────────── */}
            {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <SectionHeader stepNum="02" title="Habilidades del Facilitador"
                        subtitle="Dominio del tema, capacidad de comunicación y vinculación con el modelo educativo institucional."
                        badge="4 Ítems" accentBg="bg-indigo-600" accentText="text-indigo-600"
                        badgeBg="bg-indigo-100" badgeText="text-indigo-700" borderColor="border-indigo-50" />
                    <div className="flex flex-wrap justify-end gap-3 px-2">
                        {SCALE_EMBM_HAB.map((s, i) => (
                            <span key={i} className="text-xs text-slate-400 font-bold">
                                <span className="text-slate-700">{s.label}</span> = {s.full}
                            </span>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {SEC2.map((item, idx) => (
                            <ScaleRow key={item.name} name={item.name} label={item.label} itemNumber={idx + 1}
                                scale={SCALE_EMBM_HAB} accentBg="bg-indigo-600" accentAccent="accent-indigo-600" />
                        ))}
                    </div>
                </div>
            )}

            {/* ── PASO 3: Medios Didácticos ────────────────────── */}
            {step === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <SectionHeader stepNum="03" title="Utilización de los Medios Didácticos"
                        subtitle="Indica con qué frecuencia el facilitador utilizó cada recurso durante el cuatrimestre."
                        badge="6 Ítems" accentBg="bg-violet-600" accentText="text-violet-600"
                        badgeBg="bg-violet-100" badgeText="text-violet-700" borderColor="border-violet-50" />
                    <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500 space-y-1.5">
                        {SCALE_FREQ.map((s, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="font-bold text-slate-700 w-16 flex-shrink-0">{s.label}</span>
                                <span>{s.full}</span>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {SEC3.map((item, idx) => (
                            <FreqRow key={item.name} name={item.name} label={item.label}
                                itemNumber={idx + 1} accentBg="bg-violet-600" />
                        ))}
                    </div>
                </div>
            )}

            {/* ── PASO 4: Teoría / Práctica ────────────────────── */}
            {step === 4 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <SectionHeader stepNum="04" title="Relación Teoría / Práctica"
                        subtitle="Selecciona la opción que mejor describe el equilibrio entre teoría y práctica durante el curso."
                        badge="1 Ítem" accentBg="bg-amber-500" accentText="text-amber-600"
                        badgeBg="bg-amber-100" badgeText="text-amber-700" borderColor="border-amber-50" />
                    <div className="bg-white rounded-3xl shadow-sm border border-amber-50 p-8 space-y-3">
                        {SCALE_TP.map((opt) => (
                            <label key={opt.value}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 cursor-pointer transition-all group">
                                <input type="radio" name="teoriaPractica" value={opt.value} required
                                    className="w-5 h-5 cursor-pointer accent-amber-500 flex-shrink-0" />
                                <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 leading-relaxed">
                                    {opt.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* ── PASO 5: Autoevaluación + Comentarios ────────── */}
            {step === 5 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <SectionHeader stepNum="05" title="Autoevaluación del Alumno"
                        subtitle="Evalúa tu propio desempeño, compromiso y participación durante el cuatrimestre."
                        badge="11 Ítems" accentBg="bg-emerald-600" accentText="text-emerald-600"
                        badgeBg="bg-emerald-100" badgeText="text-emerald-700" borderColor="border-emerald-50" />
                    <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500 space-y-1.5">
                        {SCALE_FREQ.map((s, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="font-bold text-slate-700 w-16 flex-shrink-0">{s.label}</span>
                                <span>{s.full}</span>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {SEC5.map((item, idx) => (
                            <FreqRow key={item.name} name={item.name} label={item.label}
                                itemNumber={idx + 1} accentBg="bg-emerald-600" />
                        ))}
                    </div>

                    {/* Sección 6 — Comentarios */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
                        <div>
                            <span className="text-xs font-black tracking-widest uppercase text-slate-400">Sección 06</span>
                            <h2 className="text-xl font-black text-slate-800 mt-0.5">Comentarios</h2>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">
                                ¿Cuáles son las fortalezas del docente y qué sugerencias darías para hacer más dinámicas las clases?
                            </label>
                            <textarea name="comentario_fortalezas"
                                placeholder="Escribe aquí tu retroalimentación... (Opcional)"
                                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all outline-none h-28 bg-slate-50/50 text-sm resize-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">
                                ¿Consideras necesario realizar algún otro comentario respecto a tu docente?
                            </label>
                            <textarea name="comentario_adicional"
                                placeholder="Comentario adicional... (Opcional)"
                                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all outline-none h-24 bg-slate-50/50 text-sm resize-none" />
                        </div>
                    </div>
                </div>
            )}

            {/* ── NAVEGACIÓN ──────────────────────────────────── */}
            <div className="flex items-center justify-between pt-2 pb-6">
                <div className="flex gap-1.5 items-center">
                    {Array.from({ length: TOTAL }).map((_, idx) => (
                        <div key={idx} className={`rounded-full transition-all duration-500 ${step === idx + 1 ? "w-8 h-2 bg-blue-600"
                                : step > idx + 1 ? "w-2 h-2 bg-slate-400"
                                    : "w-2 h-2 bg-slate-200"}`} />
                    ))}
                    <span className="ml-2 text-xs font-bold text-slate-400">{step}/{TOTAL}</span>
                </div>

                <div className="flex gap-3">
                    {step > 1 && (
                        <button type="button" onClick={prev}
                            className="bg-white text-slate-600 px-6 py-3 rounded-2xl font-bold shadow-sm hover:bg-slate-50 border border-slate-200 active:scale-95 transition-all text-sm">
                            ← Anterior
                        </button>
                    )}
                    {step < TOTAL ? (
                        <button type="button" onClick={next}
                            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-slate-700 active:scale-95 transition-all text-sm">
                            Siguiente →
                        </button>
                    ) : (
                        <button type="submit"
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl hover:shadow-emerald-500/30 active:scale-95 transition-all text-sm">
                            ✓ Enviar Evaluación FDA-24.5
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}
