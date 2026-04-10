import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AdminScope = {
  userId: string;
  email: string | null;
  isGlobal: boolean;
  careerIds: string[];
  careers: Array<{
    id: string;
    code: string;
    name: string;
  }>;
};

export async function getCurrentAdminScope(): Promise<AdminScope | null> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string; id?: string } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session || role !== "ADMIN" || !userId) {
    return null;
  }

  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      adminHasGlobalScope: true,
      adminCareerAccesses: {
        select: {
          careerId: true,
          career: {
            select: {
              id: true,
              code: true,
              name: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          career: {
            code: "asc",
          },
        },
      },
    },
  });

  if (!admin || !admin.isActive || admin.role !== "ADMIN") {
    return null;
  }

  const careers = admin.adminCareerAccesses
    .map((access) => access.career)
    .filter((career) => career.isActive)
    .map((career) => ({
      id: career.id,
      code: career.code,
      name: career.name,
    }));

  return {
    userId: admin.id,
    email: admin.email ?? null,
    isGlobal: admin.adminHasGlobalScope,
    careerIds: careers.map((career) => career.id),
    careers,
  };
}

export async function requireAdminScope() {
  const scope = await getCurrentAdminScope();

  if (!scope) {
    redirect("/login");
  }

  return scope;
}

export async function requireGlobalAdminScope() {
  const scope = await requireAdminScope();

  if (!scope.isGlobal) {
    redirect("/admin/reportes");
  }

  return scope;
}

export function getAdminCareerIds(scope: AdminScope) {
  return scope.isGlobal ? null : scope.careerIds;
}

export function getRestrictedCareerIds(scope: AdminScope) {
  if (scope.isGlobal) {
    return null;
  }

  return scope.careerIds.length > 0 ? scope.careerIds : ["__no_access__"];
}

export function hasCareerAccess(scope: AdminScope, careerId: string) {
  return scope.isGlobal || scope.careerIds.includes(careerId);
}

export function assertCareerAccess(scope: AdminScope, careerId: string) {
  if (!hasCareerAccess(scope, careerId)) {
    throw new Error("No autorizado para operar esta carrera.");
  }
}

export function assertGlobalAdmin(scope: AdminScope) {
  if (!scope.isGlobal) {
    throw new Error("Solo el administrador principal puede realizar esta acción.");
  }
}
