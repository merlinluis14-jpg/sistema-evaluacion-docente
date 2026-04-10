"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/adminLog";
import { getCurrentAdminScope } from "@/lib/adminScope";
import { prisma } from "@/lib/prisma";

type AdminScopeMode = "global" | "assigned";

type CareerAssignmentOption = {
  targetUserId?: string;
};

async function getCurrentAdminUser() {
  const scope = await getCurrentAdminScope();

  if (!scope) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: scope.userId },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      isActive: true,
      adminHasGlobalScope: true,
    },
  });
}

async function validateAdminReauthentication(currentPassword: string) {
  const currentAdmin = await getCurrentAdminUser();

  if (!currentAdmin || currentAdmin.role !== "ADMIN" || !currentAdmin.isActive) {
    return { error: "No autorizado" as const };
  }

  if (!currentAdmin.adminHasGlobalScope) {
    return { error: "Solo el administrador principal puede gestionar cuentas administrativas" as const };
  }

  if (!currentPassword) {
    return { error: "Ingresa tu contrasena actual para autorizar la accion" as const };
  }

  const passwordMatches = await bcrypt.compare(currentPassword, currentAdmin.password);
  if (!passwordMatches) {
    return { error: "La contrasena actual del administrador no es correcta" as const };
  }

  return { currentAdmin };
}

function normalizeScopeMode(value: FormDataEntryValue | string | null | undefined): AdminScopeMode {
  return String(value ?? "").trim() === "assigned" ? "assigned" : "global";
}

function normalizeCareerIds(values: Iterable<FormDataEntryValue | string>) {
  return [
    ...new Set(
      Array.from(values)
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  ];
}

async function validateCareerAssignments(careerIds: string[], options?: CareerAssignmentOption) {
  if (careerIds.length === 0) {
    return [];
  }

  const careers = await prisma.career.findMany({
    where: {
      id: { in: careerIds },
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  if (careers.length !== careerIds.length) {
    throw new Error("Selecciona solo carreras activas y validas para la cuenta administrativa.");
  }

  const occupiedAdmins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      isActive: true,
      adminHasGlobalScope: false,
      ...(options?.targetUserId ? { id: { not: options.targetUserId } } : {}),
      adminCareerAccesses: {
        some: {
          careerId: { in: careerIds },
        },
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
      adminCareerAccesses: {
        where: {
          careerId: { in: careerIds },
        },
        select: {
          career: {
            select: {
              code: true,
            },
          },
        },
      },
    },
  });

  if (occupiedAdmins.length > 0) {
    const occupiedCareerMap = new Map<string, string>();

    for (const admin of occupiedAdmins) {
      const adminLabel = admin.email ?? admin.username ?? "otra jefatura";

      for (const access of admin.adminCareerAccesses) {
        occupiedCareerMap.set(access.career.code, adminLabel);
      }
    }

    const occupiedDetails = Array.from(occupiedCareerMap.entries())
      .sort(([codeA], [codeB]) => codeA.localeCompare(codeB, "es"))
      .map(([code, adminLabel]) => `${code} (${adminLabel})`);

    throw new Error(
      `Las siguientes carreras ya estan asignadas a otras jefaturas activas: ${occupiedDetails.join(", ")}.`,
    );
  }

  return careers.sort((a, b) => a.code.localeCompare(b.code, "es"));
}

async function countActiveGlobalAdmins(excludingUserId?: string) {
  return prisma.user.count({
    where: {
      role: "ADMIN",
      isActive: true,
      adminHasGlobalScope: true,
      ...(excludingUserId ? { id: { not: excludingUserId } } : {}),
    },
  });
}

function buildScopeDetail(scopeMode: AdminScopeMode, careers: Array<{ code: string }>) {
  if (scopeMode === "global") {
    return "Acceso global";
  }

  return `Carreras asignadas: ${careers.map((career) => career.code).join(", ")}`;
}

export async function createAdminAccount(formData: FormData) {
  const currentPassword = String(formData.get("currentPassword") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const scopeMode = normalizeScopeMode(formData.get("scopeMode"));
  const selectedCareerIds = normalizeCareerIds(formData.getAll("careerIds"));

  if (!currentPassword || !email || !password || !confirmPassword) {
    return { success: false, error: "Completa todos los campos obligatorios" };
  }

  if (!email.includes("@")) {
    return { success: false, error: "Ingresa un correo valido para la cuenta administrativa" };
  }

  if (password.length < 8) {
    return { success: false, error: "La contrasena del nuevo admin debe tener al menos 8 caracteres" };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "La confirmacion de contrasena no coincide" };
  }

  if (scopeMode === "assigned" && selectedCareerIds.length === 0) {
    return { success: false, error: "Selecciona al menos una carrera para el jefe o coordinador" };
  }

  const authResult = await validateAdminReauthentication(currentPassword);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username: email }],
    },
    select: { id: true },
  });

  if (existingUser) {
    return { success: false, error: "Ya existe una cuenta con ese identificador" };
  }

  try {
    const assignedCareers = await validateCareerAssignments(selectedCareerIds);
    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        adminHasGlobalScope: scopeMode === "global",
        adminCareerAccesses:
          scopeMode === "assigned"
            ? {
                create: assignedCareers.map((career) => ({
                  careerId: career.id,
                })),
              }
            : undefined,
      },
      select: {
        id: true,
        email: true,
      },
    });

    await logAdminAction({
      action: "CREATE",
      entity: "ADMIN",
      entityId: adminUser.id,
      detail: `Cuenta administrativa creada: ${adminUser.email} (${buildScopeDetail(scopeMode, assignedCareers)})`,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/administradores");
    revalidatePath("/admin/logs");

    return {
      success: true,
      email: adminUser.email,
      isGlobalScope: scopeMode === "global",
      careerCodes: assignedCareers.map((career) => career.code),
    };
  } catch (error) {
    console.error("Error al crear cuenta administrativa:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo crear la cuenta administrativa",
    };
  }
}

export async function updateAdminCareerScope(input: {
  targetUserId: string;
  currentPassword: string;
  scopeMode: AdminScopeMode;
  careerIds: string[];
}) {
  const authResult = await validateAdminReauthentication(input.currentPassword.trim());
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  if (!input.targetUserId) {
    return { success: false, error: "No se encontro la cuenta administrativa a configurar" };
  }

  const targetAdmin = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      adminHasGlobalScope: true,
    },
  });

  if (!targetAdmin || targetAdmin.role !== "ADMIN") {
    return { success: false, error: "La cuenta seleccionada no corresponde a un administrador" };
  }

  if (input.scopeMode === "assigned" && input.careerIds.length === 0) {
    return { success: false, error: "Selecciona al menos una carrera para el jefe o coordinador" };
  }

  if (targetAdmin.isActive && targetAdmin.adminHasGlobalScope && input.scopeMode !== "global") {
    const remainingGlobalAdmins = await countActiveGlobalAdmins(targetAdmin.id);
    if (remainingGlobalAdmins <= 0) {
      return { success: false, error: "No se puede quitar el alcance global a la ultima cuenta principal activa" };
    }
  }

  try {
    const assignedCareers = await validateCareerAssignments(input.careerIds, {
      targetUserId: targetAdmin.id,
    });

    await prisma.user.update({
      where: { id: targetAdmin.id },
      data: {
        adminHasGlobalScope: input.scopeMode === "global",
        adminCareerAccesses: {
          deleteMany: {},
          ...(input.scopeMode === "assigned"
            ? {
                create: assignedCareers.map((career) => ({
                  careerId: career.id,
                })),
              }
            : {}),
        },
      },
    });

    await logAdminAction({
      action: "UPDATE",
      entity: "ADMIN",
      entityId: targetAdmin.id,
      detail: `Alcance administrativo actualizado para ${targetAdmin.email ?? targetAdmin.id}: ${buildScopeDetail(input.scopeMode, assignedCareers)}`,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/administradores");
    revalidatePath("/admin/reportes");
    revalidatePath("/admin/logs");

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar el alcance del admin:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo actualizar el alcance administrativo",
    };
  }
}

export async function resetAdminPassword(input: {
  targetUserId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const authResult = await validateAdminReauthentication(input.currentPassword.trim());
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const currentAdmin = authResult.currentAdmin;
  const newPassword = input.newPassword ?? "";
  const confirmPassword = input.confirmPassword ?? "";

  if (!input.targetUserId || !newPassword || !confirmPassword) {
    return { success: false, error: "Completa todos los campos para restablecer la contrasena" };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "La nueva contrasena debe tener al menos 8 caracteres" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "La confirmacion de la nueva contrasena no coincide" };
  }

  const targetAdmin = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!targetAdmin || targetAdmin.role !== "ADMIN") {
    return { success: false, error: "La cuenta seleccionada no corresponde a un administrador" };
  }

  if (!targetAdmin.isActive) {
    return { success: false, error: "No se puede restablecer la contrasena de una cuenta admin inactiva" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: targetAdmin.id },
    data: { password: hashedPassword },
  });

  await logAdminAction({
    action: "UPDATE",
    entity: "ADMIN",
    entityId: targetAdmin.id,
    detail: `Contrasena restablecida para admin: ${targetAdmin.email ?? targetAdmin.id} por ${currentAdmin.email ?? currentAdmin.id}`,
  });

  revalidatePath("/admin/administradores");
  revalidatePath("/admin/logs");

  return { success: true };
}

export async function deactivateAdminAccount(input: {
  targetUserId: string;
  currentPassword: string;
}) {
  const authResult = await validateAdminReauthentication(input.currentPassword.trim());
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const currentAdmin = authResult.currentAdmin;

  if (!input.targetUserId) {
    return { success: false, error: "No se encontro la cuenta administrativa a desactivar" };
  }

  if (input.targetUserId === currentAdmin.id) {
    return { success: false, error: "No puedes desactivar tu propia cuenta desde esta pantalla" };
  }

  const targetAdmin = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: { id: true, email: true, role: true, isActive: true, adminHasGlobalScope: true },
  });

  if (!targetAdmin || targetAdmin.role !== "ADMIN") {
    return { success: false, error: "La cuenta seleccionada no corresponde a un administrador" };
  }

  if (!targetAdmin.isActive) {
    return { success: false, error: "La cuenta administrativa ya esta inactiva" };
  }

  const activeAdmins = await prisma.user.count({
    where: { role: "ADMIN", isActive: true },
  });

  if (activeAdmins <= 1) {
    return { success: false, error: "No se puede desactivar la ultima cuenta admin activa" };
  }

  if (targetAdmin.adminHasGlobalScope) {
    const remainingGlobalAdmins = await countActiveGlobalAdmins(targetAdmin.id);
    if (remainingGlobalAdmins <= 0) {
      return { success: false, error: "No se puede desactivar la ultima cuenta principal activa" };
    }
  }

  await prisma.user.update({
    where: { id: targetAdmin.id },
    data: { isActive: false },
  });

  await logAdminAction({
    action: "DEACTIVATE",
    entity: "ADMIN",
    entityId: targetAdmin.id,
    detail: `Cuenta administrativa desactivada: ${targetAdmin.email ?? targetAdmin.id} por ${currentAdmin.email ?? currentAdmin.id}`,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/administradores");
  revalidatePath("/admin/logs");

  return { success: true };
}

export async function activateAdminAccount(input: {
  targetUserId: string;
  currentPassword: string;
}) {
  const authResult = await validateAdminReauthentication(input.currentPassword.trim());
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const currentAdmin = authResult.currentAdmin;

  if (!input.targetUserId) {
    return { success: false, error: "No se encontro la cuenta administrativa a activar" };
  }

  const targetAdmin = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!targetAdmin || targetAdmin.role !== "ADMIN") {
    return { success: false, error: "La cuenta seleccionada no corresponde a un administrador" };
  }

  if (targetAdmin.isActive) {
    return { success: false, error: "La cuenta administrativa ya se encuentra activa" };
  }

  await prisma.user.update({
    where: { id: targetAdmin.id },
    data: { isActive: true },
  });

  await logAdminAction({
    action: "ACTIVATE",
    entity: "ADMIN",
    entityId: targetAdmin.id,
    detail: `Cuenta administrativa reactivada: ${targetAdmin.email ?? targetAdmin.id} por ${currentAdmin.email ?? currentAdmin.id}`,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/administradores");
  revalidatePath("/admin/logs");

  return { success: true };
}
