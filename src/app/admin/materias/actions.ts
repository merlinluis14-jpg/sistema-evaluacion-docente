"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSubject(formData: FormData) {
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const cuatrimestre = parseInt(formData.get("cuatrimestre") as string, 10);
    const teacherId = formData.get("teacherId") as string;
    const careerId = formData.get("careerId") as string;

    if (!name || !code || !cuatrimestre || !teacherId || !careerId) {
        return { success: false, error: "Todos los campos son obligatorios" };
    }

    try {
        await prisma.subject.create({
            data: {
                name,
                code,
                cuatrimestre,
                teacherId,
                careerId,
                isActive: true,
            },
        });
    } catch (error) {
        console.error("Error al crear materia:", error);
        return { success: false, error: "Error al crear la materia. Verifica que el código no esté duplicado en la misma carrera." };
    }

    revalidatePath("/admin/materias");
    redirect("/admin/materias");
}

export async function deleteSubject(id: string) {
    try {
        await prisma.subject.delete({ where: { id } });
        revalidatePath("/admin/materias");
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar materia:", error);
        return { success: false, error: "No se pudo eliminar la materia." };
    }
}
