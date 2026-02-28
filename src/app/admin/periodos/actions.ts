"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** Crea un nuevo periodo y lo deja inactivo por defecto */
export async function createPeriod(formData: FormData) {
    const name = formData.get("name") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    if (!name || !startDate || !endDate) return;

    await prisma.period.create({
        data: {
            name,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: false,
        },
    });

    revalidatePath("/admin/periodos");
    redirect("/admin/periodos");
}

/** Activa un periodo y desactiva todos los demás */
export async function activatePeriod(id: string) {
    // atomicidad: desactiva todos antes de activar el nuevo
    await prisma.$transaction([
        prisma.period.updateMany({ data: { isActive: false } }),
        prisma.period.update({ where: { id }, data: { isActive: true } }),
    ]);
    revalidatePath("/admin/periodos");
}

/** Desactiva un periodo sin activar ningún otro */
export async function deactivatePeriod(id: string) {
    await prisma.period.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/periodos");
}

/** Elimina un periodo (solo si no tiene evaluaciones) */
export async function deletePeriod(id: string) {
    const count = await prisma.evaluation.count({ where: { periodId: id } });
    if (count > 0) throw new Error("No se puede eliminar un periodo con evaluaciones registradas.");
    await prisma.period.delete({ where: { id } });
    revalidatePath("/admin/periodos");
}

