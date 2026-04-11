"use server";

import { prisma } from "@/lib/prisma";
import { isPrismaKnownRequestError } from "@/lib/prismaErrors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getStudentPlatformFeedbackState } from "@/lib/platformFeedbackState";

const FACILITATOR_KEYS = [
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
] as const;

const SKILL_KEYS = [
    "hab_item01",
    "hab_item02",
    "hab_item03",
    "hab_item04",
] as const;

const MEDIA_KEYS = [
    "med_item01",
    "med_item02",
    "med_item03",
    "med_item04",
    "med_item05",
    "med_item06",
] as const;

const SELF_ASSESSMENT_KEYS = [
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
] as const;

function parseRequiredScore(
    formData: FormData,
    key: string,
    allowedValues: readonly number[],
) {
    const rawValue = String(formData.get(key) ?? "").trim();
    if (!rawValue) {
        throw new Error(`Falta el valor requerido para ${key}`);
    }

    const parsedValue = Number(rawValue);
    if (
        !Number.isInteger(parsedValue) ||
        !allowedValues.includes(parsedValue)
    ) {
        throw new Error(`Valor invalido para ${key}`);
    }

    return parsedValue;
}

function parseOptionalText(formData: FormData, key: string, maxLength = 1500) {
    const value = String(formData.get(key) ?? "").trim();
    if (!value) {
        return null;
    }

    if (value.length > maxLength) {
        throw new Error(`El campo ${key} excede la longitud permitida`);
    }

    return value;
}

export async function createEvaluation(formData: FormData) {
    const session = await getServerSession(authOptions);

    const student = session?.user?.id && session.user.role === "ALUMNO"
        ? await prisma.student.findUnique({
            where: { userId: session.user.id },
            select: { id: true, careerId: true, isActive: true },
        })
        : null;

    if (!student?.id || !student.isActive) {
        throw new Error("No autorizado - sesión de alumno requerida");
    }

    const groupSubjectId = formData.get("groupSubjectId") as string;
    const periodId = formData.get("periodId") as string;

    if (!groupSubjectId || !periodId) {
        redirect("/alumno?error=formulario");
    }

    // La validacion final se hace en servidor para impedir evaluaciones fuera del grupo o del periodo activo.
    const [period, groupSubject] = await Promise.all([
        prisma.period.findFirst({
            where: { id: periodId, isActive: true },
            select: { id: true },
        }),
        prisma.groupSubject.findFirst({
            where: { id: groupSubjectId },
            select: {
                id: true,
                groupId: true,
                teacherId: true,
                subjectId: true,
                subject: {
                    select: {
                        id: true,
                        isActive: true,
                    },
                },
                group: {
                    select: {
                        careerId: true,
                        isActive: true,
                    },
                },
            },
        }),
    ]);

    const validEnrollment = groupSubject
        ? await prisma.groupEnrollment.findFirst({
            where: {
                studentId: student.id,
                groupId: groupSubject.groupId,
            },
            select: { id: true },
        })
        : null;

    if (
        !period ||
        !groupSubject ||
        !groupSubject.subject.isActive ||
        !groupSubject.group.isActive ||
        !groupSubject.teacherId ||
        groupSubject.group.careerId !== student.careerId ||
        !validEnrollment
    ) {
        redirect("/alumno?error=acceso");
    }

    const existing = await prisma.evaluation.findFirst({
        where: {
            studentId: student.id,
            periodId,
            OR: [
                { groupSubjectId },
                { subjectId: groupSubject.subjectId },
            ],
        },
    });

    if (existing) {
        redirect("/alumno?error=duplicada");
    }

    const evaluationPayload = (() => {
        try {
            return {
                ...Object.fromEntries(
                    FACILITATOR_KEYS.map((key) => [key, parseRequiredScore(formData, key, [1, 2, 3, 4])]),
                ),
                ...Object.fromEntries(
                    SKILL_KEYS.map((key) => [key, parseRequiredScore(formData, key, [1, 2, 3, 4, 5])]),
                ),
                ...Object.fromEntries(
                    MEDIA_KEYS.map((key) => [key, parseRequiredScore(formData, key, [1, 2, 3, 4, 5])]),
                ),
                teoriaPractica: parseRequiredScore(formData, "teoriaPractica", [1, 2, 3, 4, 5]),
                ...Object.fromEntries(
                    SELF_ASSESSMENT_KEYS.map((key) => [key, parseRequiredScore(formData, key, [1, 2, 3, 4, 5])]),
                ),
                comentario_fortalezas: parseOptionalText(formData, "comentario_fortalezas"),
                comentario_adicional: parseOptionalText(formData, "comentario_adicional"),
            };
        } catch {
            redirect("/alumno?error=formulario");
        }
    })();

    try {
        await prisma.evaluation.create({
            data: {
                studentId: student.id,
                teacherId: groupSubject.teacherId,
                subjectId: groupSubject.subjectId,
                groupSubjectId,
                periodId,
                ...evaluationPayload,
            },
        });
    } catch (error) {
        if (isPrismaKnownRequestError(error) && error.code === "P2002") {
            redirect("/alumno?error=duplicada");
        }
        console.error("Error al guardar evaluación:", error);
        redirect("/alumno?error=general");
    }

    const feedbackState = await getStudentPlatformFeedbackState(student.id, periodId);

    revalidatePath("/alumno");

    if (feedbackState.isEligible) {
        redirect("/alumno/encuesta-final");
    }

    redirect("/alumno?success=true");
}
