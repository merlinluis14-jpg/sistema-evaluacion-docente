"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function createEvaluation(formData: FormData) {
    const session = await getServerSession(authOptions);

    let studentId = "";
    if (session?.user?.name) {
        const user = await prisma.user.findUnique({ where: { username: session.user.name } });
        if (user) studentId = user.id;
    }

    // dev fallback
    if (!studentId) {
        const devStudent = await prisma.user.findFirst({ where: { role: "ALUMNO" } });
        if (devStudent) studentId = devStudent.id;
        else throw new Error("No hay alumnos registrados.");
    }

    const subjectId = formData.get("subjectId") as string;
    const teacherId = formData.get("teacherId") as string;
    const periodId = formData.get("periodId") as string;

    const existing = await prisma.evaluation.findUnique({
        where: { studentId_subjectId_periodId: { studentId, subjectId, periodId } }
    });
    if (existing) redirect("/dashboard/materias?error=duplicada");

    const num = (key: string) => parseInt(formData.get(key) as string) || 0;

    try {
        await prisma.evaluation.create({
            data: {
                studentId, teacherId, subjectId, periodId,

                // s1: facilitador
                fac_item01: num("fac_item01"), fac_item02: num("fac_item02"),
                fac_item03: num("fac_item03"), fac_item04: num("fac_item04"),
                fac_item05: num("fac_item05"), fac_item06: num("fac_item06"),
                fac_item07: num("fac_item07"), fac_item08: num("fac_item08"),
                fac_item09: num("fac_item09"), fac_item10: num("fac_item10"),
                fac_item11: num("fac_item11"),

                // s2: habilidades
                hab_item01: num("hab_item01"), hab_item02: num("hab_item02"),
                hab_item03: num("hab_item03"), hab_item04: num("hab_item04"),

                // s3: medios
                med_item01: num("med_item01"), med_item02: num("med_item02"),
                med_item03: num("med_item03"), med_item04: num("med_item04"),
                med_item05: num("med_item05"), med_item06: num("med_item06"),

                teoriaPractica: num("teoriaPractica"),

                // s5: autoevaluación
                auto_item01: num("auto_item01"), auto_item02: num("auto_item02"),
                auto_item03: num("auto_item03"), auto_item04: num("auto_item04"),
                auto_item05: num("auto_item05"), auto_item06: num("auto_item06"),
                auto_item07: num("auto_item07"), auto_item08: num("auto_item08"),
                auto_item09: num("auto_item09"), auto_item10: num("auto_item10"),
                auto_item11: num("auto_item11"),

                comentario_fortalezas: formData.get("comentario_fortalezas") as string || null,
                comentario_adicional: formData.get("comentario_adicional") as string || null,
            },
        });
    } catch (error) {
        console.error("Error al guardar evaluación:", error);
        redirect("/dashboard/materias?error=general");
    }

    revalidatePath("/dashboard/materias");
    redirect("/dashboard/materias?success=true");
}
