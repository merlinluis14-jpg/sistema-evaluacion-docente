"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { prisma } from "@/lib/prisma";

async function requireAdminSession() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== "ADMIN") {
        return null;
    }

    return session;
}

function generateTemporaryPassword(length = 12) {
    return randomBytes(length)
        .toString("base64url")
        .replace(/[^A-Za-z0-9]/g, "")
        .slice(0, length);
}

export async function createTeacher(formData: FormData) {
    const session = await requireAdminSession();
    if (!session) {
        return { success: false, error: "No autorizado" };
    }

    const name = String(formData.get("name") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const employeeId = String(formData.get("employeeId") ?? "").trim();
    const careerId = String(formData.get("careerId") ?? "").trim();
    const position = String(formData.get("position") ?? "").trim().toUpperCase();

    if (!name || !lastName || !email || !employeeId || !careerId || !position) {
        return { success: false, error: "Todos los campos son obligatorios" };
    }

    if (position !== "PA" && position !== "PTC") {
        return { success: false, error: "El tipo de docente debe ser PA o PTC" };
    }

    try {
        const temporaryPassword = generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: "DOCENTE",
                isActive: true,
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
            action: "CREATE",
            entity: "DOCENTE",
            entityId: user.id,
            detail: `Docente creado: ${name} ${lastName} (${employeeId}, ${position})`,
        });

        revalidatePath("/admin/docentes");
        revalidatePath("/admin/logs");

        return { success: true, temporaryPassword, email };
    } catch (error) {
        console.error("Error al crear docente:", error);
        return {
            success: false,
            error: "Error al crear el docente. El email o numero de empleado ya puede estar en uso.",
        };
    }
}

export async function deleteTeacher(id: string) {
    const session = await requireAdminSession();
    if (!session) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const teacher = await prisma.teacher.findUnique({ where: { id } });
        if (!teacher) {
            return { success: false, error: "Docente no encontrado" };
        }

        await prisma.teacher.update({
            where: { id },
            data: { isActive: false },
        });

        if (teacher.userId) {
            await prisma.user.update({
                where: { id: teacher.userId },
                data: { isActive: false },
            });
        }

        await logAdminAction({
            action: "DEACTIVATE",
            entity: "DOCENTE",
            entityId: id,
            detail: `Docente desactivado (soft delete): ${teacher.name} ${teacher.lastName}`,
        });

        revalidatePath("/admin/docentes");
        revalidatePath("/admin/logs");

        return { success: true };
    } catch (error) {
        console.error("Error al desactivar docente:", error);
        return { success: false, error: "No se pudo desactivar el docente." };
    }
}

export async function resetTeacherPassword(id: string) {
    const session = await requireAdminSession();
    if (!session) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const teacher = await prisma.teacher.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!teacher || !teacher.userId) {
            return { success: false, error: "Docente no encontrado" };
        }

        const temporaryPassword = generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        await prisma.user.update({
            where: { id: teacher.userId },
            data: { password: hashedPassword },
        });

        await logAdminAction({
            action: "UPDATE",
            entity: "DOCENTE",
            entityId: id,
            detail: `Contrasena temporal regenerada para docente: ${teacher.name} ${teacher.lastName}`,
        });

        revalidatePath("/admin/docentes");
        revalidatePath("/admin/logs");

        return { success: true, temporaryPassword };
    } catch (error) {
        console.error("Error al resetear contrasena:", error);
        return { success: false, error: "Error al resetear contrasena." };
    }
}
