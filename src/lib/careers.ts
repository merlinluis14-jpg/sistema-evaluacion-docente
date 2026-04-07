import { prisma } from "@/lib/prisma";

export function normalizeCareerCode(value: string) {
  return value.trim().toUpperCase();
}

export async function getCareerByCodeForImport(rawCode: string) {
  const code = normalizeCareerCode(rawCode);
  if (!code) {
    return null;
  }

  const career = await prisma.career.findUnique({
    where: { code },
  });

  if (!career) {
    return null;
  }

  if (!career.isActive) {
    return prisma.career.update({
      where: { id: career.id },
      data: { isActive: true },
    });
  }

  return career;
}
