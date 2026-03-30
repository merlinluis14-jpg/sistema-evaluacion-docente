import { prisma } from "@/lib/prisma";

export function extractCuatrimestreFromGroupName(groupName: string) {
  const match = groupName.trim().match(/^(\d+)/);
  if (!match) {
    return null;
  }

  const cuatrimestre = Number(match[1]);
  return Number.isNaN(cuatrimestre) ? null : cuatrimestre;
}

export async function syncSubjectsForGroup(groupId: string, careerId: string, groupName: string) {
  const cuatrimestre = extractCuatrimestreFromGroupName(groupName);
  if (!cuatrimestre) {
    return 0;
  }

  const subjects = await prisma.subject.findMany({
    where: {
      careerId,
      cuatrimestre,
      isActive: true,
    },
    select: { id: true },
  });

  if (subjects.length === 0) {
    return 0;
  }

  const result = await prisma.groupSubject.createMany({
    data: subjects.map((subject) => ({
      groupId,
      subjectId: subject.id,
    })),
    skipDuplicates: true,
  });

  return result.count;
}

export async function syncGroupsForSubject(subjectId: string, careerId: string, cuatrimestre: number) {
  const groups = await prisma.group.findMany({
    where: {
      careerId,
      isActive: true,
    },
    select: { id: true, name: true },
  });

  const matchingGroups = groups.filter((group) => extractCuatrimestreFromGroupName(group.name) === cuatrimestre);

  if (matchingGroups.length === 0) {
    return 0;
  }

  const result = await prisma.groupSubject.createMany({
    data: matchingGroups.map((group) => ({
      groupId: group.id,
      subjectId,
    })),
    skipDuplicates: true,
  });

  return result.count;
}
