// src/lib/adminLog.ts
// Utilidad para registrar acciones administrativas (RF12)

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type LogParams = {
  action: string;     // CREATE, UPDATE, DELETE, ACTIVATE, DEACTIVATE, IMPORT
  entity: string;     // DOCENTE, MATERIA, PERIODO, ALUMNO, EVALUACION
  entityId?: string;  // ID del registro afectado
  detail?: string;    // Descripción legible
};

/**
 * Registra una acción administrativa en la tabla AdminLog.
 * Obtiene automáticamente el userId de la sesión activa.
 * No lanza error si falla — el log no debe bloquear la acción principal.
 */
export async function logAdminAction({ action, entity, entityId, detail }: LogParams): Promise<void> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? "unknown";

    await prisma.adminLog.create({
      data: { userId, action, entity, entityId, detail },
    });
  } catch (error) {
    console.error("Error registrando log de admin:", error);
  }
}
