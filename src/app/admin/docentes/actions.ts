"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createTeacher(formData: FormData) {
    const name = formData.get("name") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const employeeId = formData.get("employeeId") as string;
    const careerId = formData.get("careerId") as string;

    if (!name || !lastName || !email || !employeeId || !careerId) {
        return { success: false, error: "Todos los campos son obligatorios" };
    }

    try {
        // El schema v2 requiere crear un User primero y luego el Teacher vinculado
        const hashedPassword = await bcrypt.hash(employeeId, 10); // contraseña temporal = número de empleado

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: "DOCENTE",
            },
        });

        await prisma.teacher.create({
            data: {
                userId: user.id,
                name,
                lastName,
                employeeId,
                careerId,
                isActive: true,
            },
        });

        revalidatePath("/admin/docentes");
        return { success: true };
    } catch (error) {
        console.error("Error al crear docente:", error);
        return { success: false, error: "Error al crear el docente. El email o número de empleado ya puede estar en uso." };
    }
}

export async function deleteTeacher(id: string) {
    try {
        // Obtener el userId antes de eliminar el teacher
        const teacher = await prisma.teacher.findUnique({ where: { id } });
        await prisma.teacher.delete({ where: { id } });
        // Eliminar también el User asociado
        if (teacher?.userId) {
            await prisma.user.delete({ where: { id: teacher.userId } });
        }
        revalidatePath("/admin/docentes");
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar:", error);
        return { success: false, error: "No se pudo eliminar el docente." };
    }
}
