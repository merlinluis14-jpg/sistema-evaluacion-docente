"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminAction } from "@/lib/adminLog";

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
        const subject = await prisma.subject.create({
            data: {
                name,
                code,
                cuatrimestre,
                teacherId,
                careerId,
                isActive: true,
            },
        });
        await logAdminAction({
            action: "CREATE", entity: "MATERIA", entityId: subject.id,
            detail: `Materia creada: ${name} (${code})`,
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
        const subject = await prisma.subject.findUnique({ where: { id }, select: { name: true, code: true } });
        await prisma.subject.delete({ where: { id } });
        await logAdminAction({
            action: "DELETE", entity: "MATERIA", entityId: id,
            detail: `Materia eliminada: ${subject?.name ?? ""} (${subject?.code ?? ""})`,
        });
        revalidatePath("/admin/materias");
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar materia:", error);
        return { success: false, error: "No se pudo eliminar la materia." };
    }
}
