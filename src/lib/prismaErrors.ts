import { Prisma } from "@prisma/client";

export function isPrismaKnownRequestError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Error interno del servidor",
) {
  return error instanceof Error ? error.message : fallback;
}
