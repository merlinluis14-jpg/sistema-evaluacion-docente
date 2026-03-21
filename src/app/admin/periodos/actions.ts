"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

export async function activatePeriod(id: string) {
    await prisma.$transaction([
        prisma.period.updateMany({ data: { isActive: false } }),
        prisma.period.update({ where: { id }, data: { isActive: true } }),
    ]);
    revalidatePath("/admin/periodos");
}

export async function deactivatePeriod(id: string) {
    await prisma.period.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/periodos");
}

export async function deletePeriod(id: string) {
    const count = await prisma.evaluation.count({ where: { periodId: id } });
    if (count > 0) throw new Error("No se puede eliminar un periodo con evaluaciones registradas.");
    await prisma.period.delete({ where: { id } });
    revalidatePath("/admin/periodos");
}

