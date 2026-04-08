"use client";

import { useRef, useState } from "react";

const SCALE_EMBM = [
  { value: 4, label: "E", full: "Excelente" },
  { value: 3, label: "MB", full: "Muy Bien" },
  { value: 2, label: "B", full: "Bien" },
  { value: 1, label: "M", full: "Malo" },
];

const SCALE_EMBMR = [
  { value: 5, label: "E", full: "Excelente" },
  { value: 4, label: "MB", full: "Muy Bien" },
  { value: 3, label: "B", full: "Bien" },
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
  { value: 2, label: "Buena combinacion de teoria y practica" },
  { value: 3, label: "Demasiada teoria y poca practica" },
  { value: 4, label: "Poca teoria y mucha practica" },
  { value: 5, label: "Poca teoria y poca practica" },
];

const SEC1 = [
  { name: "fac_item01", label: "Al inicio del cuatrimestre oriento sobre las unidades de aprendizaje, objetivos, resultados esperados, competencias, habilidades y referencias bibliograficas." },
  { name: "fac_item02", label: "Domina los contenidos de las unidades." },
  { name: "fac_item03", label: "Resumio el tema al final de cada sesion." },
  { name: "fac_item04", label: "Resumio los temas al final de cada unidad." },
  { name: "fac_item05", label: "Aclaro dudas." },
  { name: "fac_item06", label: "Impartio asesorias." },
  { name: "fac_item07", label: "Entrego los resultados del examen oportunamente." },
  { name: "fac_item08", label: "Logro los objetivos del cuatrimestre." },
  { name: "fac_item09", label: "Promovio un ambiente de respeto y disciplina." },
  { name: "fac_item10", label: "La puntualidad del facilitador y manejo del tiempo en clase." },
  { name: "fac_item11", label: "La puntualidad del alumno y manejo de la situacion por el profesor." },
];

const SEC2 = [
  { name: "hab_item01", label: "Manejo del lenguaje apropiado de la asignatura." },
  { name: "hab_item02", label: "Conduccion a los alumnos al desarrollo profesional." },
  { name: "hab_item03", label: "Capacidad del facilitador para captar la atencion del grupo." },
  { name: "hab_item04", label: "Relacion de los contenidos de la materia con las competencias del modelo educativo." },
];

const SEC3 = [
  { name: "med_item01", label: "Pizarron" },
  { name: "med_item02", label: "TV / Pantalla" },
  { name: "med_item03", label: "Canon / Proyector" },
  { name: "med_item04", label: "Webquest / Plataformas digitales" },
  { name: "med_item05", label: "Guias de trabajo" },
  { name: "med_item06", label: "Libros y bibliografia" },
];

const SEC5 = [
  { name: "auto_item01", label: "Participe en clase?" },
  { name: "auto_item02", label: "Falte a alguna clase?" },
  { name: "auto_item03", label: "Realice todos los trabajos y tareas encomendados por el profesor?" },
  { name: "auto_item04", label: "Solicite asesoria del profesor?" },
  { name: "auto_item05", label: "Aplique tecnicas de autoestudio?" },
  { name: "auto_item06", label: "Realice investigacion para ampliar el contenido de los temas?" },
  { name: "auto_item07", label: "Me presente a clases con el material necesario?" },
  { name: "auto_item08", label: "Me prepare continuamente para presentar examenes?" },
  { name: "auto_item09", label: "Puse en practica los conocimientos adquiridos." },
  { name: "auto_item10", label: "Preste en cada clase atencion y disposicion para el aprendizaje?" },
  { name: "auto_item11", label: "Desarrollo de las competencias." },
];

const STEP_FIELDS: Record<number, string[]> = {
  1: SEC1.map((item) => item.name),
  2: SEC2.map((item) => item.name),
  3: SEC3.map((item) => item.name),
  4: ["teoriaPractica"],
  5: SEC5.map((item) => item.name),
};

const STEP_TITLES: Record<number, string> = {
  1: "Evaluación del Facilitador",
  2: "Habilidades del Facilitador",
  3: "Utilización de los Medios Didácticos",
  4: "Relación Teoría / Práctica",
  5: "Autoevaluación del Alumno",
};

type ScaleOption = { value: number; label: string; full: string };

function ScaleRow({
  name,
  label,
  itemNumber,
  scale,
  accentBg,
  accentAccent,
}: {
  name: string;
  label: string;
  itemNumber: number;
  scale: ScaleOption[];
  accentBg: string;
  accentAccent: string;
}) {
  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-transparent bg-slate-50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${accentBg}`}
        >
          {itemNumber}
        </span>
        <p className="text-sm font-medium leading-relaxed text-slate-700">{label}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3 sm:justify-end">
        {scale.map((option) => (
          <label key={option.value} className="flex cursor-pointer flex-col items-center gap-1">
            <input
              type="radio"
              name={name}
              value={option.value}
              required
              className={`h-4 w-4 cursor-pointer ${accentAccent}`}
            />
            <span className="text-[11px] font-black text-slate-400 group-hover:text-slate-600" title={option.full}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FreqRow({
  name,
  label,
  itemNumber,
  accentBg,
}: {
  name: string;
  label: string;
  itemNumber: number;
  accentBg: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-start gap-x-3 rounded-2xl border border-transparent bg-slate-50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-sm sm:items-center">
      <span
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${accentBg}`}
      >
        {itemNumber}
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium leading-snug text-slate-700">{label}</p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {SCALE_FREQ.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name={name}
                value={option.value}
                required
                className="h-4 w-4 cursor-pointer accent-emerald-600"
              />
              <span className="text-[11px] font-bold text-slate-400" title={option.full}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

type SectionHeaderProps = {
  stepNum: string;
  title: string;
  subtitle: string;
  badge: string;
  accentBg: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
};

function SectionHeader({
  stepNum,
  title,
  subtitle,
  badge,
  accentBg,
  accentText,
  badgeBg,
  badgeText,
  borderColor,
}: SectionHeaderProps) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-sm sm:p-8 ${borderColor}`}>
      <div className={`absolute left-0 top-0 h-full w-1.5 ${accentBg}`} />
      <div className="mb-3 flex flex-col gap-3 pl-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className={`text-xs font-black uppercase tracking-widest ${accentText}`}>Sección {stepNum}</span>
          <h2 className="mt-0.5 text-lg font-black text-slate-800 sm:text-xl">{title}</h2>
        </div>
        <span className={`w-fit flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold ${badgeBg} ${badgeText}`}>
          {badge}
        </span>
      </div>
      <p className="pl-3 text-sm leading-relaxed text-slate-400">{subtitle}</p>
    </div>
  );
}

export function EvaluationForm({
  subjectId,
  periodId,
  action,
}: {
  subjectId: string;
  periodId: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const totalSteps = 5;

  const next = () => setStep((current) => Math.min(current + 1, totalSteps));
  const prev = () => setStep((current) => Math.max(current - 1, 1));

  const focusField = (fieldName: string) => {
    const target =
      formRef.current?.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`) ??
      formRef.current?.querySelector<HTMLTextAreaElement>(`textarea[name="${fieldName}"]`);

    if (!target) return;

    target.focus();
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const showValidationError = (stepToShow: number, fieldName: string) => {
    setValidationMessage(`Completa la sección "${STEP_TITLES[stepToShow]}" antes de continuar.`);

    if (step === stepToShow) {
      focusField(fieldName);
      return;
    }

    setStep(stepToShow);
    window.setTimeout(() => focusField(fieldName), 0);
  };

  const validateStepFields = (stepToValidate: number) => {
    const form = formRef.current;
    if (!form) return true;

    const missingField = STEP_FIELDS[stepToValidate].find(
      (fieldName) => !form.querySelector(`input[name="${fieldName}"]:checked`),
    );

    if (!missingField) {
      setValidationMessage(null);
      return true;
    }

    showValidationError(stepToValidate, missingField);
    return false;
  };

  const handleNext = () => {
    if (!validateStepFields(step)) return;
    next();
  };

  const steps = [
    { label: "Facilitador", bg: "bg-blue-600" },
    { label: "Habilidades", bg: "bg-indigo-600" },
    { label: "Medios", bg: "bg-violet-600" },
    { label: "Teoría / Práctica", bg: "bg-amber-500" },
    { label: "Autoevaluación", bg: "bg-emerald-600" },
  ];

  return (
    <form
      ref={formRef}
      noValidate
      onChange={() => {
        if (validationMessage) {
          setValidationMessage(null);
        }
      }}
      onSubmit={(event) => {
        for (let stepIndex = 1; stepIndex <= totalSteps; stepIndex += 1) {
          if (!validateStepFields(stepIndex)) {
            event.preventDefault();
            return;
          }
        }

        setLoading(true);
      }}
      action={async (formData) => {
        try {
          await action(formData);
        } finally {
          setLoading(false);
        }
      }}
      className="w-full animate-in space-y-6 fade-in duration-500"
    >
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="periodId" value={periodId} />

      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 sm:items-center sm:px-5">
        <p className="text-sm font-medium leading-relaxed text-blue-700">
          Tu evaluación es <strong>completamente anónima</strong>. El docente no podrá identificarte.
        </p>
      </div>

      {validationMessage && (
        <div
          id="evaluation-form-error"
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
        >
          {validationMessage}
        </div>
      )}

      <div
        className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-1"
        role="list"
        aria-label="Progreso de la evaluación"
      >
        {steps.map((item, index) => (
          <div key={item.label} className="flex flex-shrink-0 items-center gap-2" role="listitem">
            <div
              aria-current={step === index + 1 ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-300 ${
                step === index + 1
                  ? `${item.bg} text-white shadow-md`
                  : step > index + 1
                    ? "bg-slate-200 text-slate-400 line-through"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              <span>{index + 1}</span>
              <span className="hidden md:inline">{item.label}</span>
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`h-0.5 w-4 rounded-full transition-all ${
                  step > index + 1 ? "bg-slate-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className={`space-y-4 ${step === 1 ? "animate-in slide-in-from-right-4" : "hidden"}`}>
        <SectionHeader
          stepNum="01"
          title="Evaluación del Facilitador"
          subtitle="Desempeño general, puntualidad, dominio de contenidos y cumplimiento de objetivos institucionales."
          badge="11 Items"
          accentBg="bg-blue-600"
          accentText="text-blue-600"
          badgeBg="bg-blue-100"
          badgeText="text-blue-700"
          borderColor="border-blue-50"
        />
        <div className="flex flex-wrap justify-end gap-3 px-2">
          {SCALE_EMBM.map((item) => (
            <span key={item.value} className="text-xs font-bold text-slate-400">
              <span className="text-slate-700">{item.label}</span> = {item.full}
            </span>
          ))}
        </div>
        <div className="space-y-3">
          {SEC1.map((item, index) => (
            <ScaleRow
              key={item.name}
              name={item.name}
              label={item.label}
              itemNumber={index + 1}
              scale={SCALE_EMBM}
              accentBg="bg-blue-600"
              accentAccent="accent-blue-600"
            />
          ))}
        </div>
      </div>

      <div className={`space-y-4 ${step === 2 ? "animate-in slide-in-from-right-4" : "hidden"}`}>
        <SectionHeader
          stepNum="02"
          title="Habilidades del Facilitador"
          subtitle="Dominio del tema, capacidad de comunicacion y vinculacion con el modelo educativo institucional."
          badge="4 Items"
          accentBg="bg-indigo-600"
          accentText="text-indigo-600"
          badgeBg="bg-indigo-100"
          badgeText="text-indigo-700"
          borderColor="border-indigo-50"
        />
        <div className="flex flex-wrap justify-end gap-3 px-2">
          {SCALE_EMBMR.map((item) => (
            <span key={item.value} className="text-xs font-bold text-slate-400">
              <span className="text-slate-700">{item.label}</span> = {item.full}
            </span>
          ))}
        </div>
        <div className="space-y-3">
          {SEC2.map((item, index) => (
            <ScaleRow
              key={item.name}
              name={item.name}
              label={item.label}
              itemNumber={index + 1}
              scale={SCALE_EMBMR}
              accentBg="bg-indigo-600"
              accentAccent="accent-indigo-600"
            />
          ))}
        </div>
      </div>

      <div className={`space-y-4 ${step === 3 ? "animate-in slide-in-from-right-4" : "hidden"}`}>
        <SectionHeader
          stepNum="03"
          title="Utilización de los Medios Didácticos"
          subtitle="Indica con que frecuencia el facilitador utilizo cada recurso durante el cuatrimestre."
          badge="6 Items"
          accentBg="bg-violet-600"
          accentText="text-violet-600"
          badgeBg="bg-violet-100"
          badgeText="text-violet-700"
          borderColor="border-violet-50"
        />
        <div className="space-y-1.5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
          {SCALE_FREQ.map((item) => (
            <div key={item.value} className="flex gap-2">
              <span className="w-16 flex-shrink-0 font-bold text-slate-700">{item.label}</span>
              <span>{item.full}</span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {SEC3.map((item, index) => (
            <FreqRow
              key={item.name}
              name={item.name}
              label={item.label}
              itemNumber={index + 1}
              accentBg="bg-violet-600"
            />
          ))}
        </div>
      </div>

      <div className={`space-y-4 ${step === 4 ? "animate-in slide-in-from-right-4" : "hidden"}`}>
        <SectionHeader
          stepNum="04"
          title="Relación Teoría / Práctica"
          subtitle="Selecciona la opción que mejor describe el equilibrio entre teoría y práctica durante el curso."
          badge="1 Item"
          accentBg="bg-amber-500"
          accentText="text-amber-600"
          badgeBg="bg-amber-100"
          badgeText="text-amber-700"
          borderColor="border-amber-50"
        />
        <div className="space-y-3 rounded-3xl border border-amber-50 bg-white p-5 shadow-sm sm:p-8">
          {SCALE_TP.map((option) => (
            <label
              key={option.value}
              className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-100 p-4 transition-all hover:border-amber-200 hover:bg-amber-50/50"
            >
              <input
                type="radio"
                name="teoriaPractica"
                value={option.value}
                required
                className="h-5 w-5 flex-shrink-0 cursor-pointer accent-amber-500"
              />
              <span className="text-sm font-medium leading-relaxed text-slate-700 group-hover:text-slate-900">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className={`space-y-4 ${step === 5 ? "animate-in slide-in-from-right-4" : "hidden"}`}>
        <SectionHeader
          stepNum="05"
          title="Autoevaluación del Alumno"
          subtitle="Evalúa tu propio desempeño, compromiso y participación durante el cuatrimestre."
          badge="11 Items"
          accentBg="bg-emerald-600"
          accentText="text-emerald-600"
          badgeBg="bg-emerald-100"
          badgeText="text-emerald-700"
          borderColor="border-emerald-50"
        />
        <div className="space-y-1.5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
          {SCALE_FREQ.map((item) => (
            <div key={item.value} className="flex gap-2">
              <span className="w-16 flex-shrink-0 font-bold text-slate-700">{item.label}</span>
              <span>{item.full}</span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {SEC5.map((item, index) => (
            <FreqRow
              key={item.name}
              name={item.name}
              label={item.label}
              itemNumber={index + 1}
              accentBg="bg-emerald-600"
            />
          ))}
        </div>

        <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Sección 06
            </span>
            <h2 className="mt-0.5 text-xl font-black text-slate-800">Comentarios</h2>
          </div>

          <div className="space-y-2">
            <label htmlFor="comentario_fortalezas" className="block text-sm font-bold text-slate-700">
              ¿Cuáles son las fortalezas del docente y qué sugerencias darías para hacer más dinámicas las clases?
            </label>
            <textarea
              id="comentario_fortalezas"
              name="comentario_fortalezas"
              placeholder="Escribe aquí tu retroalimentación... (Opcional)"
              className="h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="comentario_adicional" className="block text-sm font-bold text-slate-700">
              ¿Consideras necesario realizar algún otro comentario respecto a tu docente?
            </label>
            <textarea
              id="comentario_adicional"
              name="comentario_adicional"
              placeholder="Comentario adicional... (Opcional)"
              className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 pb-6 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5" aria-label={`Paso ${step} de ${totalSteps}`}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`rounded-full transition-all duration-500 ${
                step === index + 1
                  ? "h-2 w-8 bg-blue-600"
                  : step > index + 1
                    ? "h-2 w-2 bg-slate-400"
                    : "h-2 w-2 bg-slate-200"
              }`}
            />
          ))}
          <span className="ml-2 text-xs font-bold text-slate-400" aria-live="polite">
            {step}/{totalSteps}
          </span>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {step > 1 && (
            <button
              type="button"
              onClick={prev}
              disabled={loading}
              className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 sm:w-auto"
            >
              Anterior
            </button>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-700 active:scale-95 sm:w-auto"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-10 py-3 text-sm font-black text-white shadow-xl transition-all hover:shadow-emerald-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Enviando...
                </>
              ) : (
                "Enviar Evaluación"
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
