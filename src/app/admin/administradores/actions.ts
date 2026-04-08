"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { prisma } from "@/lib/prisma";

async function getCurrentAdminUser() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string; id?: string } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session || role !== "ADMIN" || !userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      isActive: true,
    },
  });
}

async function validateAdminReauthentication(currentPassword: string) {
  const currentAdmin = await getCurrentAdminUser();
  if (!currentAdmin || currentAdmin.role !== "ADMIN" || !currentAdmin.isActive) {
    return { error: "No autorizado" as const };
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

export async function createAdminAccount(formData: FormData) {
  const currentPassword = String(formData.get("currentPassword") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

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

  const authResult = await validateAdminReauthentication(currentPassword);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username: email },
      ],
    },
    select: { id: true },
  });

  if (existingUser) {
    return { success: false, error: "Ya existe una cuenta con ese identificador" };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
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
      detail: `Cuenta administrativa creada: ${adminUser.email}`,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/administradores");
    revalidatePath("/admin/logs");

    return { success: true, email: adminUser.email };
  } catch (error) {
    console.error("Error al crear cuenta administrativa:", error);
    return { success: false, error: "No se pudo crear la cuenta administrativa" };
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
    select: { id: true, email: true, role: true, isActive: true },
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
