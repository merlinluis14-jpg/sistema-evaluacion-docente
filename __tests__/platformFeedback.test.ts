import {
  buildPlatformFeedbackEligibility,
  buildPlatformFeedbackQuestionSummaries,
  getPlatformFeedbackScoreLabel,
  getUniqueAssignedGroupSubjectIds,
} from "@/lib/platformFeedback";

describe("platform feedback helpers", () => {
  it("construye materias unicas a partir de grupos enlazados", () => {
    const subjectIds = getUniqueAssignedGroupSubjectIds([
      {
        group: {
          subjects: [{ id: "assignment_1" }, { id: "assignment_2" }],
        },
      },
      {
        group: {
          subjects: [{ id: "assignment_2" }, { id: "assignment_3" }],
        },
      },
    ]);

    expect(subjectIds).toEqual(["assignment_1", "assignment_2", "assignment_3"]);
  });

  it("marca elegible solo cuando completo todas sus evaluaciones y aun no responde", () => {
    const state = buildPlatformFeedbackEligibility({
      assignedAssignmentIds: ["assignment_1", "assignment_2"],
      evaluatedAssignmentIds: ["assignment_1", "assignment_2"],
      hasResponse: false,
    });

    expect(state).toEqual({
      assignedSubjectCount: 2,
      completedSubjectCount: 2,
      hasCompletedAllEvaluations: true,
      hasResponse: false,
      isEligible: true,
    });
  });

  it("bloquea la elegibilidad cuando ya existe una respuesta previa", () => {
    const state = buildPlatformFeedbackEligibility({
      assignedAssignmentIds: ["assignment_1"],
      evaluatedAssignmentIds: ["assignment_1"],
      hasResponse: true,
    });

    expect(state.isEligible).toBe(false);
    expect(state.hasCompletedAllEvaluations).toBe(true);
  });

  it("resume conteos y promedios por pregunta", () => {
    const summaries = buildPlatformFeedbackQuestionSummaries([
      { q1: 3, q2: 3, q3: 2, q4: 2, q5: 1 },
      { q1: 2, q2: 3, q3: 1, q4: 2, q5: 1 },
    ]);

    expect(summaries[0]).toMatchObject({
      key: "q1",
      total: 2,
      average: 2.5,
      bueno: 1,
      regular: 1,
      malo: 0,
    });

    expect(summaries[4]).toMatchObject({
      key: "q5",
      total: 2,
      average: 1,
      bueno: 0,
      regular: 0,
      malo: 2,
    });
  });

  it("devuelve una lectura cualitativa del promedio general", () => {
    expect(getPlatformFeedbackScoreLabel(2.7)).toEqual({
      label: "Bueno",
      tone: "emerald",
    });
    expect(getPlatformFeedbackScoreLabel(2)).toEqual({
      label: "Regular",
      tone: "amber",
    });
    expect(getPlatformFeedbackScoreLabel(1.2)).toEqual({
      label: "Malo",
      tone: "rose",
    });
  });
});
