import { createEvaluation } from "@/app/admin/evaluaciones/actions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
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
    evaluation: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

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
    (prisma.evaluation.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.evaluation.create as jest.Mock).mockResolvedValue({ id: "eval_1" });
  });

  function buildFormData(overrides?: Record<string, string>) {
    const formData = new FormData();
    formData.append("subjectId", "subject_1");
    formData.append("teacherId", "teacher_real");
    formData.append("periodId", "period_1");
    formData.append("fac_item01", "4");

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

  it("guarda la evaluacion y revalida la vista del alumno", async () => {
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
        }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/alumno");
  });
});
