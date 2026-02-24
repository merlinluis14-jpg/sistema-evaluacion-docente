"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTeacher(formData: FormData) {
    const name = formData.get("name") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const employeeId = formData.get("employeeId") as string;
    const department = formData.get("department") as string;

    if (!name || !lastName || !email || !employeeId || !department) {
        return { success: false, error: "Todos los campos son obligatorios" };
    }

    try {
        await prisma.teacher.create({
            data: {
                name,
                lastName,
                email,
                employeeId,
                department,
                isActive: true,
            } as any,
        });

        revalidatePath("/dashboard/docentes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error al crear el docente en la base de datos" };
    }
}

export async function deleteTeacher(id: string) {
    try {
        await prisma.teacher.delete({
            where: { id },
        });
        revalidatePath("/dashboard/docentes");
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar:", error);
        return { success: false, error: "No se pudo eliminar el docente." };
    }
}
