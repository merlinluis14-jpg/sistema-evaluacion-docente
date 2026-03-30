import {
  buildInstitutionalFinalScore,
  buildStudentReport,
  getCareerHeadAverage,
  getApplicableCareerHeadFactors,
} from "@/lib/reportes";

describe("utilidades de reportes", () => {
  it("calcula correctamente el reporte estudiantil por secciones", () => {
    const evaluation = {
      fac_item01: 4,
      fac_item02: 4,
      fac_item03: 4,
      fac_item04: 4,
      fac_item05: 4,
      fac_item06: 4,
      fac_item07: 4,
      fac_item08: 4,
      fac_item09: 4,
      fac_item10: 4,
      fac_item11: 4,
      hab_item01: 5,
      hab_item02: 5,
      hab_item03: 5,
      hab_item04: 5,
      med_item01: 3,
      med_item02: 3,
      med_item03: 3,
      med_item04: 3,
      med_item05: 3,
      med_item06: 3,
      auto_item01: 2,
      auto_item02: 2,
      auto_item03: 2,
      auto_item04: 2,
      auto_item05: 2,
      auto_item06: 2,
      auto_item07: 2,
      auto_item08: 2,
      auto_item09: 2,
      auto_item10: 2,
      auto_item11: 2,
    };

    const report = buildStudentReport([evaluation]);

    expect(report.promedios.fac).toBe(4);
    expect(report.promedios.hab).toBe(5);
    expect(report.promedios.med).toBe(3);
    expect(report.promedios.auto).toBe(2);
    expect(report.promedios.global).toBe(4);
  });

  it("omite factores no aplicables para docentes PA al calcular la evaluacion de coordinacion", () => {
    const applicablePaFactors = getApplicableCareerHeadFactors("PA");

    expect(applicablePaFactors.some((factor) => factor.key === "researchScore")).toBe(false);
    expect(applicablePaFactors.some((factor) => factor.key === "tutoringScore")).toBe(false);
    expect(applicablePaFactors.some((factor) => factor.key === "advisoryScore")).toBe(false);

    const average = getCareerHeadAverage(
      {
        planCourseScore: 5,
        competencyEvalScore: 4,
        researchScore: 1,
        tutoringScore: 1,
        advisoryScore: 1,
        platformUsageScore: 5,
        problemSolvingScore: 5,
        punctualityScore: 4,
        teamworkScore: 5,
      },
      "PA",
    );

    expect(average).toBeCloseTo(4.6667, 4);
  });

  it("genera la calificacion institucional final sobre base de 10 puntos", () => {
    expect(buildInstitutionalFinalScore(4.5, 4.0)).toBe(8.5);
  });
});
