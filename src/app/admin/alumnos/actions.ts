"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { prisma } from "@/lib/prisma";
import { getSessionRole } from "@/lib/sessionUser";

export async function resetStudentPassword(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || getSessionRole(session) !== "ADMIN") {
    return { success: false, error: "No autorizado" };
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student || !student.userId) {
      return { success: false, error: "Alumno no encontrado" };
    }

    const hashedPassword = await bcrypt.hash(student.matricula, 10);

    await prisma.user.update({
      where: { id: student.userId },
      data: {
        password: hashedPassword,
        canChangeInitialPassword: true,
      },
    });

    await logAdminAction({
      action: "UPDATE",
      entity: "ALUMNO",
      entityId: student.id,
      detail: `Contrasena restablecida a matricula para alumno: ${student.name} ${student.lastName} (${student.matricula})`,
    });

    revalidatePath("/admin/alumnos");
    revalidatePath("/admin/logs");
    revalidatePath("/alumno");
    revalidatePath("/alumno/cambiar-contrasena");

    return { success: true };
  } catch (error) {
    console.error("Error al restablecer la contrasena del alumno:", error);
    return { success: false, error: "No fue posible restablecer la contrasena del alumno" };
  }
}
