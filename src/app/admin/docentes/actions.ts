"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { logAdminAction } from "@/lib/adminLog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createTeacher(formData: FormData) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'ADMIN') {
        return { success: false, error: "No autorizado" };
    }

    const name = formData.get("name") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const employeeId = formData.get("employeeId") as string;
    const careerId = formData.get("careerId") as string;
    const position = (formData.get("position") as string | null)?.toUpperCase();

    if (!name || !lastName || !email || !employeeId || !careerId || !position) {
        return { success: false, error: "Todos los campos son obligatorios" };
    }

    if (position !== "PA" && position !== "PTC") {
        return { success: false, error: "El tipo de docente debe ser PA o PTC" };
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
                position,
                isActive: true,
            },
        });

        await logAdminAction({
            action: "CREATE", entity: "DOCENTE", entityId: user.id,
            detail: `Docente creado: ${name} ${lastName} (${employeeId}, ${position})`,
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
        // Hacemos Soft-Delete para no romper las FK de las evaluaciones históricas
        const teacher = await prisma.teacher.findUnique({ where: { id } });
        if (teacher) {
            await prisma.teacher.update({ where: { id }, data: { isActive: false } });
            if (teacher.userId) {
                await prisma.user.update({ where: { id: teacher.userId }, data: { isActive: false } });
            }
        }
        await logAdminAction({
            action: "DEACTIVATE", entity: "DOCENTE", entityId: id,
            detail: `Docente desactivado (Soft Delete): ${teacher?.name ?? ""} ${teacher?.lastName ?? ""}`,
        });
        revalidatePath("/admin/docentes");
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar:", error);
        return { success: false, error: "No se pudo eliminar el docente." };
    }
}

export async function resetTeacherPassword(id: string) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'ADMIN') {
        return { success: false, error: "No autorizado" };
    }

    try {
        const teacher = await prisma.teacher.findUnique({ where: { id }, include: { user: true } });
        if (!teacher || !teacher.userId) return { success: false, error: "Docente no encontrado" };

        const hashedPassword = await bcrypt.hash(teacher.employeeId, 10);
        await prisma.user.update({
            where: { id: teacher.userId },
            data: { password: hashedPassword }
        });

        await logAdminAction({
            action: "UPDATE", entity: "DOCENTE", entityId: id,
            detail: `Contraseña reseteada (a Número Empleado) para docente: ${teacher.name} ${teacher.lastName}`
        });

        return { success: true };
    } catch (error) {
        console.error("Error al resetear contraseña:", error);
        return { success: false, error: "Error al resetear contraseña." };
    }
}
