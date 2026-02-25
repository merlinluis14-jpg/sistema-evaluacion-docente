"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSubject(formData: FormData) {
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const cuatrimestre = parseInt(formData.get("cuatrimestre") as string, 10);
    const teacherId = formData.get("teacherId") as string;

    if (!name || !code || !cuatrimestre || !teacherId) {
        return { success: false, error: "Todos los campos son obligatorios" };
    }

    try {
        await prisma.subject.create({
            data: {
                name,
                code,
                cuatrimestre,
                teacherId,
                isActive: true,
            },
        });
    } catch (error) {
        console.error("Error al crear materia:", error);
        return { success: false, error: "Error al crear la materia en la base de datos. Puede que el código ya exista." };
    }

    revalidatePath("/dashboard/materias");
    redirect("/dashboard/materias");
}

export async function deleteSubject(id: string) {
    try {
        await prisma.subject.delete({
            where: { id },
        });
        revalidatePath("/dashboard/materias");
        return { success: true };
    } catch (error) {
        console.error("Error al eliminando materia:", error);
        return { success: false, error: "No se pudo eliminar la materia." };
    }
}
