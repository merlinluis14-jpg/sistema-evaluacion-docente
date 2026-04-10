export const PLATFORM_FEEDBACK_OPTIONS = [
  { value: 3, label: "Bueno" },
  { value: 2, label: "Regular" },
  { value: 1, label: "Malo" },
] as const;

export const PLATFORM_FEEDBACK_QUESTIONS = [
  {
    key: "q1",
    label: "El sistema te permitio evaluar a tus profesores de forma clara y facil.",
  },
  {
    key: "q2",
    label: "Encontrar tus materias y docentes dentro del sistema fue sencillo.",
  },
  {
    key: "q3",
    label: "El proceso para responder la evaluacion fue agil y ordenado.",
  },
  {
    key: "q4",
    label: "La presentacion del sistema te dio confianza para responder de forma anonima.",
  },
  {
    key: "q5",
    label: "Consideras util que la evaluacion docente se realice mediante este sistema.",
  },
] as const;

export type PlatformFeedbackQuestionKey = (typeof PLATFORM_FEEDBACK_QUESTIONS)[number]["key"];

type EnrollmentWithSubjects = {
  group: {
    subjects: Array<{
      subjectId: string;
    }>;
  };
};

type ResponseWithScores = Record<PlatformFeedbackQuestionKey, number>;

export function getUniqueAssignedSubjectIds(enrollments: EnrollmentWithSubjects[]) {
  return Array.from(
    new Set(
      enrollments.flatMap((enrollment) =>
        enrollment.group.subjects.map((groupSubject) => groupSubject.subjectId),
      ),
    ),
  );
}

export function buildPlatformFeedbackEligibility({
  assignedSubjectIds,
  evaluatedSubjectIds,
  hasResponse,
}: {
  assignedSubjectIds: string[];
  evaluatedSubjectIds: string[];
  hasResponse: boolean;
}) {
  const assignedIds = Array.from(new Set(assignedSubjectIds));
  const evaluatedIds = new Set(evaluatedSubjectIds);
  const completedSubjectCount = assignedIds.filter((subjectId) => evaluatedIds.has(subjectId)).length;
  const hasCompletedAllEvaluations =
    assignedIds.length > 0 && completedSubjectCount >= assignedIds.length;

  return {
    assignedSubjectCount: assignedIds.length,
    completedSubjectCount,
    hasCompletedAllEvaluations,
    hasResponse,
    isEligible: hasCompletedAllEvaluations && !hasResponse,
  };
}

export function buildPlatformFeedbackQuestionSummaries(responses: ResponseWithScores[]) {
  return PLATFORM_FEEDBACK_QUESTIONS.map((question) => {
    const values = responses.map((response) => response[question.key]);
    const bueno = values.filter((value) => value === 3).length;
    const regular = values.filter((value) => value === 2).length;
    const malo = values.filter((value) => value === 1).length;
    const total = values.length;
    const average =
      total > 0 ? Number((values.reduce((sum, value) => sum + value, 0) / total).toFixed(2)) : 0;

    return {
      ...question,
      total,
      average,
      bueno,
      regular,
      malo,
      buenoPercent: getPercent(bueno, total),
      regularPercent: getPercent(regular, total),
      maloPercent: getPercent(malo, total),
    };
  });
}

export function getPlatformFeedbackScoreLabel(score: number) {
  if (score >= 2.5) {
    return { label: "Bueno", tone: "emerald" as const };
  }

  if (score >= 1.75) {
    return { label: "Regular", tone: "amber" as const };
  }

  return { label: "Malo", tone: "rose" as const };
}

export function getPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Number(((value / total) * 100).toFixed(1));
}
