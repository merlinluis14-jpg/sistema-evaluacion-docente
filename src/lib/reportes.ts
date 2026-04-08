export type TeacherPosition = "PA" | "PTC";

export type DetailItem = {
  label: string;
  valor: number;
  max: number;
};

export type TheoryPracticeSummaryItem = {
  value: number;
  label: string;
  count: number;
  percentage: number;
};

export type TheoryPracticeSummary = {
  items: TheoryPracticeSummaryItem[];
  predominant: TheoryPracticeSummaryItem | null;
  totalResponses: number;
};

export type CareerHeadFactorKey =
  | "planCourseScore"
  | "competencyEvalScore"
  | "researchScore"
  | "tutoringScore"
  | "advisoryScore"
  | "platformUsageScore"
  | "problemSolvingScore"
  | "punctualityScore"
  | "teamworkScore";

export type CareerHeadFactorDefinition = {
  key: CareerHeadFactorKey;
  label: string;
  description: string;
  appliesTo: TeacherPosition[];
};

export const careerHeadFactors: CareerHeadFactorDefinition[] = [
  {
    key: "planCourseScore",
    label: "Elaboracion de plan curso, avance programatico y evidencias",
    description:
      "Elaborar los documentos que establece el manual de procedimientos eficientemente y con un diseno favorable que promueva la toma de decisiones.",
    appliesTo: ["PA", "PTC"],
  },
  {
    key: "competencyEvalScore",
    label: "Evaluación del aprendizaje por competencias EC, ED y EP",
    description:
      "Registrar documentos de manera correcta, con informacion concreta, relevante y veraz para entregarlos en tiempo y forma.",
    appliesTo: ["PA", "PTC"],
  },
  {
    key: "researchScore",
    label: "Investigación",
    description:
      "Desarrollar investigación, difundir resultados, asesorar tesis y promover la participación estudiantil conforme a la normativa institucional.",
    appliesTo: ["PTC"],
  },
  {
    key: "tutoringScore",
    label: "Tutorías",
    description:
      "Diagnosticar, planear y atender acciones tutoriales grupales e individuales, canalizando casos específicos cuando corresponda.",
    appliesTo: ["PTC"],
  },
  {
    key: "advisoryScore",
    label: "Asesorías",
    description:
      "Orientar al estudiante para fortalecer su aprendizaje significativo y controlar los formatos establecidos por el programa institucional.",
    appliesTo: ["PTC"],
  },
  {
    key: "platformUsageScore",
    label: "Utilizacion de plataformas",
    description:
      "Planear, evaluar y dar seguimiento con materiales y estrategias complementarias apoyadas en plataformas y recursos de apoyo.",
    appliesTo: ["PA", "PTC"],
  },
  {
    key: "problemSolvingScore",
    label: "Solucion de problemas",
    description:
      "Identificar, analizar y resolver problemas con juicio y criterio, encontrando soluciones viables y efectivas.",
    appliesTo: ["PA", "PTC"],
  },
  {
    key: "punctualityScore",
    label: "Puntualidad",
    description:
      "Presentarse en horario y realizar actividades encomendadas en tiempo, asistiendo a juntas y compromisos institucionales.",
    appliesTo: ["PA", "PTC"],
  },
  {
    key: "teamworkScore",
    label: "Trabajo en equipo",
    description:
      "Trabajar eficazmente con otros para lograr objetivos comunes, compartir informacion y fomentar la productividad.",
    appliesTo: ["PA", "PTC"],
  },
];

const facilitatorItems = [
  { key: "fac_item01", label: "Oriento sobre unidades al inicio", max: 4 },
  { key: "fac_item02", label: "Domina los contenidos", max: 4 },
  { key: "fac_item03", label: "Resumió temas por sesión", max: 4 },
  { key: "fac_item04", label: "Resumió temas por unidad", max: 4 },
  { key: "fac_item05", label: "Aclaró dudas", max: 4 },
  { key: "fac_item06", label: "Impartió asesorías", max: 4 },
  { key: "fac_item07", label: "Entregó resultados oportunamente", max: 4 },
  { key: "fac_item08", label: "Logro objetivos del cuatrimestre", max: 4 },
  { key: "fac_item09", label: "Promovió respeto y disciplina", max: 4 },
  { key: "fac_item10", label: "Puntualidad del facilitador", max: 4 },
  { key: "fac_item11", label: "Puntualidad del alumno (manejo)", max: 4 },
] as const;

const skillItems = [
  { key: "hab_item01", label: "Manejo del lenguaje apropiado", max: 5 },
  { key: "hab_item02", label: "Conducción al desarrollo profesional", max: 5 },
  { key: "hab_item03", label: "Capacidad para captar atención", max: 5 },
  { key: "hab_item04", label: "Relación con competencias del modelo", max: 5 },
] as const;

const mediaItems = [
  { key: "med_item01", label: "Pizarrón", max: 5 },
  { key: "med_item02", label: "TV / Pantalla", max: 5 },
  { key: "med_item03", label: "Canon / Proyector", max: 5 },
  { key: "med_item04", label: "Webquest / Plataformas dig.", max: 5 },
  { key: "med_item05", label: "Guías de trabajo", max: 5 },
  { key: "med_item06", label: "Libros y bibliografía", max: 5 },
] as const;

const selfAssessmentItems = [
  { key: "auto_item01", label: "Participó en clase", max: 5 },
  { key: "auto_item02", label: "Se ausentó a clases", max: 5 },
  { key: "auto_item03", label: "Realizó todos los trabajos", max: 5 },
  { key: "auto_item04", label: "Solicitó asesoría", max: 5 },
  { key: "auto_item05", label: "Aplicó técnicas de autoestudio", max: 5 },
  { key: "auto_item06", label: "Realizó investigación extra", max: 5 },
  { key: "auto_item07", label: "Asistió con material necesario", max: 5 },
  { key: "auto_item08", label: "Se preparó para exámenes", max: 5 },
  { key: "auto_item09", label: "Puso en práctica conocimientos", max: 5 },
  { key: "auto_item10", label: "Mantuvo atención en clase", max: 5 },
  { key: "auto_item11", label: "Desarrolló competencias", max: 5 },
] as const;

export const theoryPracticeOptions = [
  { value: 1, label: "De acuerdo a la naturaleza del curso, estuvo bien" },
  { value: 2, label: "Buena combinación de teoría y práctica" },
  { value: 3, label: "Demasiada teoría y poca práctica" },
  { value: 4, label: "Poca teoría y mucha práctica" },
  { value: 5, label: "Poca teoría y poca práctica" },
] as const;

type EvaluationLike = Record<string, unknown>;
type CareerHeadEvaluationLike = Partial<Record<CareerHeadFactorKey, number | null>> & {
  comments?: string | null;
  evaluatorName?: string | null;
};

export function getTeacherPositionLabel(position: TeacherPosition) {
  return position === "PTC" ? "Profesor(a) de Tiempo Completo" : "Profesor(a) de Asignatura";
}

export function getApplicableCareerHeadFactors(position: TeacherPosition) {
  return careerHeadFactors.filter((factor) => factor.appliesTo.includes(position));
}

// Ignora nulos para que los factores no aplicables o pendientes no alteren el promedio.
export function computeAverage(values: Array<number | null | undefined>) {
  const validValues = values.filter(
    (value): value is number => value !== null && value !== undefined && !Number.isNaN(value),
  );
  if (validValues.length === 0) {
    return 0;
  }
  return validValues.reduce((acc, value) => acc + value, 0) / validValues.length;
}

export function normalizeAverageToFive(value: number, max: number) {
  if (max <= 0 || value <= 0) {
    return 0;
  }

  return (value / max) * 5;
}

function computeSectionAverage(evaluations: EvaluationLike[], itemKeys: readonly string[]) {
  return computeAverage(
    evaluations.map((evaluation) =>
      computeAverage(itemKeys.map((key) => Number(evaluation[key]) || 0)),
    ),
  );
}

function buildSectionDetails(
  evaluations: EvaluationLike[],
  items: readonly { key: string; label: string; max: number }[],
) {
  const total = evaluations.length || 1;
  return items.map((item) => ({
    label: item.label,
    valor: Number(
      (
        evaluations.reduce((acc, evaluation) => acc + (Number(evaluation[item.key]) || 0), 0) /
        total
      ).toFixed(2),
    ),
    max: item.max,
  }));
}

export function buildTheoryPracticeSummary(
  evaluations: EvaluationLike[],
): TheoryPracticeSummary {
  const totalResponses = evaluations.reduce((acc, evaluation) => {
    const value = Number(evaluation.teoriaPractica) || 0;
    return value >= 1 && value <= 5 ? acc + 1 : acc;
  }, 0);

  const items = theoryPracticeOptions.map((option) => {
    const count = evaluations.reduce((acc, evaluation) => {
      const value = Number(evaluation.teoriaPractica) || 0;
      return acc + (value === option.value ? 1 : 0);
    }, 0);

    return {
      value: option.value,
      label: option.label,
      count,
      percentage: Number(
        (totalResponses > 0 ? (count / totalResponses) * 100 : 0).toFixed(2),
      ),
    };
  });

  const predominant = items.reduce<TheoryPracticeSummaryItem | null>((current, item) => {
    if (item.count === 0) {
      return current;
    }

    if (!current || item.count > current.count) {
      return item;
    }

    return current;
  }, null);

  return {
    items,
    predominant,
    totalResponses,
  };
}

export function buildStudentReport(evaluations: EvaluationLike[]) {
  const facilitador = buildSectionDetails(evaluations, facilitatorItems);
  const habilidades = buildSectionDetails(evaluations, skillItems);
  const medios = buildSectionDetails(evaluations, mediaItems);
  const autoevaluacion = buildSectionDetails(evaluations, selfAssessmentItems);
  const teoriaPractica = buildTheoryPracticeSummary(evaluations);

  const promedioFac = Number(
    computeSectionAverage(
      evaluations,
      facilitatorItems.map((item) => item.key),
    ).toFixed(2),
  );
  const promedioHab = Number(
    computeSectionAverage(
      evaluations,
      skillItems.map((item) => item.key),
    ).toFixed(2),
  );
  const promedioMed = Number(
    computeSectionAverage(
      evaluations,
      mediaItems.map((item) => item.key),
    ).toFixed(2),
  );
  const promedioAuto = Number(
    computeSectionAverage(
      evaluations,
      selfAssessmentItems.map((item) => item.key),
    ).toFixed(2),
  );
  const promedioFacNormalizado = Number(
    normalizeAverageToFive(promedioFac, 4).toFixed(2),
  );
  const promedioGlobal = Number(
    computeAverage([promedioFacNormalizado, promedioHab, promedioMed]).toFixed(2),
  );

  return {
    facilitador,
    habilidades,
    medios,
    autoevaluacion,
    teoriaPractica,
    promedios: {
      fac: promedioFac,
      facNormalized: promedioFacNormalizado,
      hab: promedioHab,
      med: promedioMed,
      auto: promedioAuto,
      global: promedioGlobal,
    },
  };
}

export function getPerformanceLevel(globalAverage: number) {
  if (globalAverage >= 3.5) return "Excelente";
  if (globalAverage >= 2.5) return "Bueno";
  if (globalAverage >= 1.5) return "Regular";
  if (globalAverage > 0) return "Deficiente";
  return "Sin datos";
}

export function getPerformanceLevelColor(globalAverage: number) {
  if (globalAverage >= 3.5) return "emerald";
  if (globalAverage >= 2.5) return "blue";
  if (globalAverage >= 1.5) return "amber";
  if (globalAverage > 0) return "red";
  return "slate";
}

export function getCareerHeadAverage(
  evaluation: CareerHeadEvaluationLike | null | undefined,
  position: TeacherPosition,
) {
  if (!evaluation) {
    return 0;
  }

  return Number(
    computeAverage(
      getApplicableCareerHeadFactors(position).map((factor) => evaluation[factor.key] ?? null),
    ).toFixed(4),
  );
}

export function buildCareerHeadRows(
  evaluation: CareerHeadEvaluationLike | null | undefined,
  position: TeacherPosition,
) {
  return careerHeadFactors.map((factor) => {
    const rawValue = evaluation?.[factor.key];
    const applies = factor.appliesTo.includes(position);

    return {
      ...factor,
      applies,
      value: !applies ? null : rawValue ?? null,
      displayValue:
        !applies
          ? "N/A"
          : rawValue === null || rawValue === undefined
            ? "Pendiente"
            : String(rawValue),
    };
  });
}

export function buildInstitutionalFinalScore(
  careerHeadAverage: number,
  studentAverage: number,
) {
  return Number((careerHeadAverage + studentAverage).toFixed(4));
}
