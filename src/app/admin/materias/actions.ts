"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { resyncGroupsForSubject } from "@/lib/groupAssignments";
import { prisma } from "@/lib/prisma";
import { getSessionRole } from "@/lib/sessionUser";

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || getSessionRole(session) !== "ADMIN") {
        throw new Error("No autorizado");
    }
}

export async function createSubject(formData: FormData) {
    await requireAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    const cuatrimestre = parseInt(String(formData.get("cuatrimestre") ?? ""), 10);
    const teacherId = String(formData.get("teacherId") ?? "").trim();
    const careerId = String(formData.get("careerId") ?? "").trim();

    if (!name || !code || !teacherId || !careerId || Number.isNaN(cuatrimestre)) {
        return { success: false, error: "Todos los campos son obligatorios" };
    }

    if (cuatrimestre < 1 || cuatrimestre > 12) {
        return { success: false, error: "El cuatrimestre debe estar entre 1 y 12" };
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

        await resyncGroupsForSubject(subject.id, careerId, cuatrimestre);

        await logAdminAction({
            action: "CREATE",
            entity: "MATERIA",
            entityId: subject.id,
            detail: `Materia creada: ${name} (${code})`,
        });
    } catch (error) {
        console.error("Error al crear materia:", error);
        return {
            success: false,
            error: "Error al crear la materia. Verifica que el codigo no este duplicado en la misma carrera.",
        };
    }

    revalidatePath("/admin/materias");
    redirect("/admin/materias");
}

export async function deleteSubject(id: string) {
    await requireAdmin();

    try {
        const subject = await prisma.subject.findUnique({
            where: { id },
            select: { name: true, code: true, isActive: true },
        });

        if (!subject) {
            return { success: false, error: "Materia no encontrada" };
        }

        if (!subject.isActive) {
            return { success: false, error: "La materia ya estaba inactiva" };
        }

        await prisma.subject.update({
            where: { id },
            data: { isActive: false },
        });

        await logAdminAction({
            action: "DEACTIVATE",
            entity: "MATERIA",
            entityId: id,
            detail: `Materia desactivada: ${subject.name} (${subject.code})`,
        });

        revalidatePath("/admin/materias");
        revalidatePath("/admin/logs");

        return { success: true };
    } catch (error) {
        console.error("Error al desactivar materia:", error);
        return { success: false, error: "No se pudo desactivar la materia." };
    }
}
