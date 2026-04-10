"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAdminAction } from "@/lib/adminLog";
import { requireGlobalAdminScope } from "@/lib/adminScope";
import { normalizeCareerCode } from "@/lib/careers";
import { prisma } from "@/lib/prisma";
import { formatAcademicText } from "@/lib/text/academicText";

function normalizeCareerName(value: string) {
  return formatAcademicText(value);
}

function validateCareerCode(code: string) {
  return /^[A-Z0-9-]{2,12}$/.test(code);
}

function revalidateCareerViews() {
  revalidatePath("/admin/carreras");
  revalidatePath("/admin/docentes");
  revalidatePath("/admin/docentes/nuevo");
  revalidatePath("/admin/materias");
  revalidatePath("/admin/materias/nueva");
  revalidatePath("/admin/grupos");
  revalidatePath("/admin/grupos/nuevo");
  revalidatePath("/admin/alumnos");
  revalidatePath("/admin/alumnos/importar");
  revalidatePath("/admin/reportes");
  revalidatePath("/admin/logs");
}

export async function createCareer(formData: FormData) {
  await requireGlobalAdminScope();

  const code = normalizeCareerCode(String(formData.get("code") ?? ""));
  const name = normalizeCareerName(String(formData.get("name") ?? ""));

  if (!code || !name) {
    redirect("/admin/carreras/nueva?error=campos");
  }

  if (!validateCareerCode(code)) {
    redirect("/admin/carreras/nueva?error=codigo");
  }

  const existingCareer = await prisma.career.findUnique({
    where: { code },
    select: { id: true },
  });

  if (existingCareer) {
    redirect("/admin/carreras/nueva?error=duplicado");
  }

  const career = await prisma.career.create({
    data: {
      code,
      name,
      isActive: true,
    },
  });

  await logAdminAction({
    action: "CREATE",
    entity: "CARRERA",
    entityId: career.id,
    detail: `Carrera creada: ${career.code} - ${career.name}`,
  });

  revalidateCareerViews();
  redirect("/admin/carreras?success=creada");
}

export async function updateCareer(formData: FormData) {
  await requireGlobalAdminScope();

  const id = String(formData.get("id") ?? "").trim();
  const name = normalizeCareerName(String(formData.get("name") ?? ""));

  if (!id || !name) {
    redirect(`/admin/carreras/${id}/editar?error=campos`);
  }

  const existingCareer = await prisma.career.findUnique({
    where: { id },
    select: { id: true, code: true, name: true },
  });

  if (!existingCareer) {
    redirect("/admin/carreras?error=no-encontrada");
  }

  await prisma.career.update({
    where: { id },
    data: { name },
  });

  await logAdminAction({
    action: "UPDATE",
    entity: "CARRERA",
    entityId: id,
    detail: `Carrera actualizada: ${existingCareer.code} - ${formatAcademicText(existingCareer.name)} -> ${name}`,
  });

  revalidateCareerViews();
  redirect("/admin/carreras?success=actualizada");
}

export async function deactivateCareer(id: string) {
  await requireGlobalAdminScope();

  const career = await prisma.career.findUnique({
    where: { id },
    select: { id: true, code: true, name: true, isActive: true },
  });

  if (!career) {
    return { success: false, error: "Carrera no encontrada." };
  }

  if (!career.isActive) {
    return { success: true };
  }

  const [teachers, students, subjects, groups] = await Promise.all([
    prisma.teacher.count({ where: { careerId: id, isActive: true } }),
    prisma.student.count({ where: { careerId: id, isActive: true } }),
    prisma.subject.count({ where: { careerId: id, isActive: true } }),
    prisma.group.count({ where: { careerId: id, isActive: true } }),
  ]);

  if (teachers + students + subjects + groups > 0) {
    return {
      success: false,
      error:
        "No se puede desactivar la carrera mientras tenga docentes, alumnos, materias o grupos activos asociados.",
    };
  }

  await prisma.career.update({
    where: { id },
    data: { isActive: false },
  });

  await logAdminAction({
    action: "DEACTIVATE",
    entity: "CARRERA",
    entityId: id,
    detail: `Carrera desactivada: ${career.code} - ${formatAcademicText(career.name)}`,
  });

  revalidateCareerViews();
  return { success: true };
}

export async function activateCareer(id: string) {
  await requireGlobalAdminScope();

  const career = await prisma.career.findUnique({
    where: { id },
    select: { id: true, code: true, name: true, isActive: true },
  });

  if (!career) {
    return { success: false, error: "Carrera no encontrada." };
  }

  if (career.isActive) {
    return { success: true };
  }

  await prisma.career.update({
    where: { id },
    data: { isActive: true },
  });

  await logAdminAction({
    action: "ACTIVATE",
    entity: "CARRERA",
    entityId: id,
    detail: `Carrera reactivada: ${career.code} - ${formatAcademicText(career.name)}`,
  });

  revalidateCareerViews();
  return { success: true };
}
