"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaKnownRequestError } from "@/lib/prismaErrors";
import { getStudentPlatformFeedbackState } from "@/lib/platformFeedbackState";

const QUESTION_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;

function parseRequiredScore(formData: FormData, key: string) {
  const rawValue = String(formData.get(key) ?? "").trim();
  if (!rawValue) {
    throw new Error(`Falta el valor requerido para ${key}`);
  }

  const parsedValue = Number(rawValue);
  if (!Number.isInteger(parsedValue) || ![1, 2, 3].includes(parsedValue)) {
    throw new Error(`Valor invalido para ${key}`);
  }

  return parsedValue;
}

export async function createPlatformFeedback(formData: FormData) {
  const session = await getServerSession(authOptions);

  const student = session?.user?.id && session.user.role === "ALUMNO"
    ? await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true, isActive: true },
      })
    : null;

  if (!student?.id || !student.isActive) {
    redirect("/login");
  }

  const periodId = String(formData.get("periodId") ?? "").trim();

  if (!periodId) {
    redirect("/alumno");
  }

  const activePeriod = await prisma.period.findFirst({
    where: { id: periodId, isActive: true },
    select: { id: true },
  });

  if (!activePeriod) {
    redirect("/alumno");
  }

  const feedbackState = await getStudentPlatformFeedbackState(student.id, periodId);

  if (feedbackState.hasResponse) {
    redirect("/alumno?success=encuesta-final");
  }

  if (!feedbackState.hasCompletedAllEvaluations) {
    redirect("/alumno");
  }

  const payload = (() => {
    try {
      return Object.fromEntries(
        QUESTION_KEYS.map((key) => [key, parseRequiredScore(formData, key)]),
      ) as Record<(typeof QUESTION_KEYS)[number], number>;
    } catch {
      redirect("/alumno/encuesta-final?error=formulario");
    }
  })();

  try {
    await prisma.platformFeedbackResponse.create({
      data: {
        studentId: student.id,
        periodId,
        ...payload,
      },
    });
  } catch (error) {
    if (isPrismaKnownRequestError(error) && error.code === "P2002") {
      redirect("/alumno?success=encuesta-final");
    }

    console.error("Error al guardar la encuesta final del sistema:", error);
    redirect("/alumno/encuesta-final?error=general");
  }

  revalidatePath("/alumno");
  revalidatePath("/admin/retroalimentacion-sistema");
  redirect("/alumno?success=encuesta-final");
}
