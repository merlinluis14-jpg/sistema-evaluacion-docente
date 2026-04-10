"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminAction } from "@/lib/adminLog";
import { requireGlobalAdminScope } from "@/lib/adminScope";
import { prisma } from "@/lib/prisma";

export async function createPeriod(formData: FormData) {
    const name = formData.get("name") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    if (!name || !startDate || !endDate) return;
    await requireGlobalAdminScope();

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
        throw new Error("La fecha de inicio debe ser anterior a la fecha de fin.");
    }

    const period = await prisma.period.create({
        data: {
            name,
            startDate: start,
            endDate: end,
            isActive: false,
        },
    });
    await logAdminAction({
        action: "CREATE", entity: "PERIODO", entityId: period.id,
      detail: `Período creado: ${name}`,
    });

    revalidatePath("/admin/periodos");
    redirect("/admin/periodos");
}

export async function activatePeriod(id: string) {
    await requireGlobalAdminScope();
    await prisma.$transaction([
        prisma.period.updateMany({ data: { isActive: false } }),
        prisma.period.update({ where: { id }, data: { isActive: true } }),
    ]);
    const period = await prisma.period.findUnique({ where: { id }, select: { name: true } });
    await logAdminAction({
        action: "ACTIVATE", entity: "PERIODO", entityId: id,
      detail: `Período activado: ${period?.name ?? id}`,
    });
    revalidatePath("/admin/periodos");
}

export async function deactivatePeriod(id: string) {
    await requireGlobalAdminScope();
    await prisma.period.update({ where: { id }, data: { isActive: false } });
    const period = await prisma.period.findUnique({ where: { id }, select: { name: true } });
    await logAdminAction({
        action: "DEACTIVATE", entity: "PERIODO", entityId: id,
      detail: `Período desactivado: ${period?.name ?? id}`,
    });
    revalidatePath("/admin/periodos");
}

export async function deletePeriod(id: string) {
    await requireGlobalAdminScope();
    const count = await prisma.evaluation.count({ where: { periodId: id } });
  if (count > 0) throw new Error("No se puede eliminar un período con evaluaciones registradas.");
    const period = await prisma.period.findUnique({ where: { id }, select: { name: true } });
    await prisma.period.delete({ where: { id } });
    await logAdminAction({
        action: "DELETE", entity: "PERIODO", entityId: id,
      detail: `Período eliminado: ${period?.name ?? id}`,
    });
    revalidatePath("/admin/periodos");
}
