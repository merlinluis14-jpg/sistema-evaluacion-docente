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

export async function resyncGroupsForSubject(
  subjectId: string,
  careerId: string,
  cuatrimestre: number,
) {
  const groups = await prisma.group.findMany({
    where: {
      careerId,
      isActive: true,
    },
    select: { id: true, name: true },
  });

  const matchingGroupIds = groups
    .filter((group) => extractCuatrimestreFromGroupName(group.name) === cuatrimestre)
    .map((group) => group.id);

  const existingLinks = await prisma.groupSubject.findMany({
    where: { subjectId },
    select: { id: true, groupId: true },
  });

  const matchingGroupIdSet = new Set(matchingGroupIds);
  const obsoleteLinkIds = existingLinks
    .filter((link) => !matchingGroupIdSet.has(link.groupId))
    .map((link) => link.id);

  if (obsoleteLinkIds.length > 0) {
    await prisma.groupSubject.deleteMany({
      where: { id: { in: obsoleteLinkIds } },
    });
  }

  const existingGroupIds = new Set(existingLinks.map((link) => link.groupId));
  const groupsToCreate = matchingGroupIds.filter((groupId) => !existingGroupIds.has(groupId));

  if (groupsToCreate.length > 0) {
    await prisma.groupSubject.createMany({
      data: groupsToCreate.map((groupId) => ({
        groupId,
        subjectId,
      })),
      skipDuplicates: true,
    });
  }

  return groupsToCreate.length;
}

export async function resolveManualGroupIdsForCareer(
  careerId: string,
  groupIds: string[],
  cuatrimestre?: number,
) {
  const normalizedIds = [...new Set(groupIds.map((groupId) => groupId.trim()).filter(Boolean))];

  if (normalizedIds.length === 0) {
    return [];
  }

  const validGroups = await prisma.group.findMany({
    where: {
      id: { in: normalizedIds },
      careerId,
      isActive: true,
    },
    select: { id: true, name: true },
  });

  if (validGroups.length !== normalizedIds.length) {
    return null;
  }

  if (
    cuatrimestre !== undefined &&
    validGroups.some((group) => extractCuatrimestreFromGroupName(group.name) !== cuatrimestre)
  ) {
    return null;
  }

  const validIdSet = new Set(validGroups.map((group) => group.id));
  return normalizedIds.filter((groupId) => validIdSet.has(groupId));
}

export async function replaceGroupsForSubject(subjectId: string, groupIds: string[]) {
  await prisma.groupSubject.deleteMany({
    where: { subjectId },
  });

  if (groupIds.length === 0) {
    return 0;
  }

  const result = await prisma.groupSubject.createMany({
    data: groupIds.map((groupId) => ({
      groupId,
      subjectId,
    })),
    skipDuplicates: true,
  });

  return result.count;
}
