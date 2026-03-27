import { createEvaluation } from "@/app/admin/evaluaciones/actions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

// Mocks de Next.js y NextAuth
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

// Mock de Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    student: { findUnique: jest.fn() },
    evaluation: { findUnique: jest.fn(), create: jest.fn() },
    period: { findUnique: jest.fn() },
  }
}));

describe("Acción: createEvaluation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user_1", role: "ALUMNO" }
    });
    (prisma.student.findUnique as jest.Mock).mockResolvedValue({ id: "student_1" });
  });

  it("Debe redirigir con error si se intenta enviar una evaluación duplicada", async () => {
    // Simula que el alumno ya evaluó esa materia en ese periodo
    (prisma.evaluation.findUnique as jest.Mock).mockResolvedValue({
      id: "eval_1",
      studentId: "student_1",
      subjectId: "subj_1",
      periodId: "period_1"
    });

    const formData = new FormData();
    formData.append("subjectId", "subj_1");
    formData.append("teacherId", "teacher_1");
    formData.append("periodId", "period_1");

    await createEvaluation(formData);

    // Debe llamar a redirect con el error de duplicado (línea 32 original)
    expect(redirect).toHaveBeenCalledWith("/alumno?error=duplicada");
  });

  it("Debe guardar la evaluación correctamente si no existe duplicado", async () => {
    // Simula que no hay evaluación previa
    (prisma.evaluation.findUnique as jest.Mock).mockResolvedValue(null);
    // Simula que el periodo está activo
    (prisma.period.findUnique as jest.Mock).mockResolvedValue({ isActive: true });
    
    const formData = new FormData();
    formData.append("subjectId", "subj_1");
    formData.append("teacherId", "teacher_1");
    formData.append("periodId", "period_1");
    formData.append("fac_item01", "4");

    await createEvaluation(formData);

    expect(prisma.evaluation.create).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/alumno?success=true");
  });
});
