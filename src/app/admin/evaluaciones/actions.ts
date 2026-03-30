"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function createEvaluation(formData: FormData) {
    const session = await getServerSession(authOptions);

    const student = session?.user?.id
        ? await prisma.student.findUnique({
            where: { userId: session.user.id },
            select: { id: true, careerId: true, isActive: true },
        })
        : null;

    if (!student?.id || !student.isActive) {
        throw new Error("No autorizado - sesion de alumno requerida");
    }

    const subjectId = formData.get("subjectId") as string;
    const teacherId = formData.get("teacherId") as string;
    const periodId = formData.get("periodId") as string;

    if (!subjectId || !teacherId || !periodId) {
        redirect("/alumno?error=general");
    }

    // La validacion final se hace en servidor para impedir evaluaciones fuera del grupo o del periodo activo.
    const [period, subject, enrollment] = await Promise.all([
        prisma.period.findFirst({
            where: { id: periodId, isActive: true },
            select: { id: true },
        }),
        prisma.subject.findFirst({
            where: { id: subjectId, isActive: true },
            select: { id: true, teacherId: true, careerId: true },
        }),
        prisma.groupEnrollment.findFirst({
            where: {
                studentId: student.id,
                group: {
                    subjects: {
                        some: { subjectId },
                    },
                },
            },
            select: { id: true },
        }),
    ]);

    if (
        !period ||
        !subject ||
        subject.teacherId !== teacherId ||
        subject.careerId !== student.careerId ||
        !enrollment
    ) {
        redirect("/alumno?error=acceso");
    }

    const existing = await prisma.evaluation.findUnique({
        where: {
            studentId_subjectId_periodId: {
                studentId: student.id,
                subjectId,
                periodId,
            },
        },
    });

    if (existing) {
        redirect("/alumno?error=duplicada");
    }

    const num = (key: string) => parseInt(formData.get(key) as string) || 0;
    const text = (key: string) => {
        const value = (formData.get(key) as string | null)?.trim();
        return value ? value : null;
    };

    try {
        await prisma.evaluation.create({
            data: {
                studentId: student.id,
                teacherId: subject.teacherId,
                subjectId,
                periodId,
                fac_item01: num("fac_item01"),
                fac_item02: num("fac_item02"),
                fac_item03: num("fac_item03"),
                fac_item04: num("fac_item04"),
                fac_item05: num("fac_item05"),
                fac_item06: num("fac_item06"),
                fac_item07: num("fac_item07"),
                fac_item08: num("fac_item08"),
                fac_item09: num("fac_item09"),
                fac_item10: num("fac_item10"),
                fac_item11: num("fac_item11"),
                hab_item01: num("hab_item01"),
                hab_item02: num("hab_item02"),
                hab_item03: num("hab_item03"),
                hab_item04: num("hab_item04"),
                med_item01: num("med_item01"),
                med_item02: num("med_item02"),
                med_item03: num("med_item03"),
                med_item04: num("med_item04"),
                med_item05: num("med_item05"),
                med_item06: num("med_item06"),
                teoriaPractica: num("teoriaPractica"),
                auto_item01: num("auto_item01"),
                auto_item02: num("auto_item02"),
                auto_item03: num("auto_item03"),
                auto_item04: num("auto_item04"),
                auto_item05: num("auto_item05"),
                auto_item06: num("auto_item06"),
                auto_item07: num("auto_item07"),
                auto_item08: num("auto_item08"),
                auto_item09: num("auto_item09"),
                auto_item10: num("auto_item10"),
                auto_item11: num("auto_item11"),
                comentario_fortalezas: text("comentario_fortalezas"),
                comentario_adicional: text("comentario_adicional"),
            },
        });
    } catch (error) {
        console.error("Error al guardar evaluacion:", error);
        redirect("/alumno?error=general");
    }

    revalidatePath("/alumno");
    redirect("/alumno?success=true");
}
