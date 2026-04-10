import { createEvaluation } from "@/app/admin/evaluaciones/actions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/prismaErrors", () => ({
  isPrismaKnownRequestError: jest.fn(() => false),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    student: { findUnique: jest.fn() },
    period: { findFirst: jest.fn() },
    subject: { findFirst: jest.fn() },
    groupEnrollment: { findFirst: jest.fn() },
    platformFeedbackResponse: { findUnique: jest.fn() },
    evaluation: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

const facilitatorKeys = [
  "fac_item01",
  "fac_item02",
  "fac_item03",
  "fac_item04",
  "fac_item05",
  "fac_item06",
  "fac_item07",
  "fac_item08",
  "fac_item09",
  "fac_item10",
  "fac_item11",
];

const skillKeys = [
  "hab_item01",
  "hab_item02",
  "hab_item03",
  "hab_item04",
];

const mediaKeys = [
  "med_item01",
  "med_item02",
  "med_item03",
  "med_item04",
  "med_item05",
  "med_item06",
];

const selfAssessmentKeys = [
  "auto_item01",
  "auto_item02",
  "auto_item03",
  "auto_item04",
  "auto_item05",
  "auto_item06",
  "auto_item07",
  "auto_item08",
  "auto_item09",
  "auto_item10",
  "auto_item11",
];

describe("createEvaluation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user_1", role: "ALUMNO" },
    });
    (prisma.student.findUnique as jest.Mock).mockResolvedValue({
      id: "student_1",
      careerId: "career_1",
      isActive: true,
    });
    (prisma.period.findFirst as jest.Mock).mockResolvedValue({ id: "period_1" });
    (prisma.subject.findFirst as jest.Mock).mockResolvedValue({
      id: "subject_1",
      teacherId: "teacher_real",
      careerId: "career_1",
    });
    (prisma.groupEnrollment.findFirst as jest.Mock).mockResolvedValue({ id: "enrollment_1" });
    (prisma.platformFeedbackResponse.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.evaluation.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.evaluation.create as jest.Mock).mockResolvedValue({ id: "eval_1" });
  });

  function buildFormData(overrides?: Record<string, string>) {
    const formData = new FormData();
    formData.append("subjectId", "subject_1");
    formData.append("periodId", "period_1");
    formData.append("teoriaPractica", "2");

    facilitatorKeys.forEach((key) => formData.append(key, "4"));
    skillKeys.forEach((key) => formData.append(key, "5"));
    mediaKeys.forEach((key) => formData.append(key, "3"));
    selfAssessmentKeys.forEach((key) => formData.append(key, "2"));

    Object.entries(overrides ?? {}).forEach(([key, value]) => {
      formData.set(key, value);
    });

    return formData;
  }

  it("redirige cuando el alumno intenta duplicar una evaluacion", async () => {
    (prisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
      id: "eval_existing",
    });

    await expect(createEvaluation(buildFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/alumno?error=duplicada",
    );
  });

  it("redirige por acceso invalido si la materia no pertenece al grupo del alumno", async () => {
    (prisma.groupEnrollment.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(createEvaluation(buildFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/alumno?error=acceso",
    );
  });

  it("redirige si faltan reactivos obligatorios o si llegan valores invalidos", async () => {
    await expect(createEvaluation(buildFormData({ hab_item01: "9" }))).rejects.toThrow(
      "NEXT_REDIRECT:/alumno?error=formulario",
    );

    await expect(createEvaluation(buildFormData({ teoriaPractica: "" }))).rejects.toThrow(
      "NEXT_REDIRECT:/alumno?error=formulario",
    );
  });

  it("guarda la evaluacion completa y revalida la vista del alumno", async () => {
    await expect(createEvaluation(buildFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/alumno?success=true",
    );

    expect(prisma.evaluation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: "student_1",
          subjectId: "subject_1",
          periodId: "period_1",
          teacherId: "teacher_real",
          fac_item01: 4,
          hab_item01: 5,
          med_item01: 3,
          teoriaPractica: 2,
          auto_item01: 2,
        }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/alumno");
  });
});
