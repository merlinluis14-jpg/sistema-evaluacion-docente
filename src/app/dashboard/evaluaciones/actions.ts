"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function createEvaluation(formData: FormData) {
    const session = await getServerSession(authOptions);

    // Intentamos obtener el usuario (alumno) logueado
    let studentId = "";
    if (session?.user?.name) {
        const user = await prisma.user.findUnique({
            where: { username: session.user.name }
        });
        if (user) studentId = user.id;
    }

    // Mock para asegurar que la evaluación funcione si el usuario no tiene la sesión activa de alumno durante pruebas 
    if (!studentId) {
        const devStudent = await prisma.user.findFirst({ where: { role: "ALUMNO" } });
        if (devStudent) {
            studentId = devStudent.id;
        } else {
            throw new Error("No hay alumnos registrados en la base de datos para realizar la evaluación.");
        }
    }

    const subjectId = formData.get("subjectId") as string;
    const teacherId = formData.get("teacherId") as string;
    const comentarios = formData.get("comentarios") as string;

    // Convertimos los valores a números (Alineados a schema.prisma)
    const facilitadorAvg = parseFloat(formData.get("facilitadorAvg") as string) || 0;
    const habilidadesAvg = parseFloat(formData.get("habilidadesAvg") as string) || 0;
    const mediosAvg = parseFloat(formData.get("mediosAvg") as string) || 0;
    const autoEvalAvg = parseFloat(formData.get("autoEvalAvg") as string) || 0;
    const teoriaPractica = parseInt(formData.get("teoriaPractica") as string) || 0;

    // Verificamos ANTES de insertar si el alumno ya evaluó esta materia
    const existing = await prisma.evaluation.findUnique({
        where: {
            studentId_subjectId: {
                studentId,
                subjectId,
            }
        }
    });

    if (existing) {
        redirect("/dashboard/materias?error=duplicada");
    }

    try {
        await prisma.evaluation.create({
            data: {
                studentId,
                teacherId,
                subjectId,
                facilitadorAvg,
                habilidadesAvg,
                mediosAvg,
                autoEvalAvg,
                teoriaPractica,
                comentarios,
            },
        });
    } catch (error) {
        console.error("Error al guardar evaluación:", error);
        redirect("/dashboard/materias?error=general");
    }

    revalidatePath("/dashboard/materias");
    redirect("/dashboard/materias?success=true");
}
