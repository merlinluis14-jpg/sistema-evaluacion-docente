import { prisma } from "@/lib/prisma";

type TeacherCatalogSyncParams = {
  careerIds: string[];
  importedEmployeeIds: string[];
};

type CareerCatalogSyncParams = {
  importedCareerExternalIds: number[];
};

type CareerCatalogCleanupResult = {
  deactivatedCount: number;
  removedCount: number;
};

type SubjectCatalogSyncParams = {
  careerIds: string[];
  importedSubjectKeys: string[];
};

type GroupCatalogSyncParams = {
  careerIds: string[];
  period: string;
  importedGroupKeys: string[];
};

type GroupAssignmentCatalogSyncParams = {
  groupIds: string[];
  importedAssignmentKeys: string[];
};

type StudentPeriodSyncParams = {
  careerIds: string[];
  period: string;
  expectedGroupByStudentId: Map<string, string>;
};

export async function syncTeacherCatalogByCareer({
  careerIds,
  importedEmployeeIds,
}: TeacherCatalogSyncParams) {
  if (careerIds.length === 0) {
    return 0;
  }

  const teachersToDeactivate = await prisma.teacher.findMany({
    where: {
      careerId: { in: careerIds },
      isActive: true,
      employeeId: { notIn: importedEmployeeIds },
    },
    select: { id: true, userId: true },
  });

  if (teachersToDeactivate.length === 0) {
    return 0;
  }

  await prisma.teacher.updateMany({
    where: { id: { in: teachersToDeactivate.map((teacher) => teacher.id) } },
    data: { isActive: false },
  });

  await prisma.user.updateMany({
    where: { id: { in: teachersToDeactivate.map((teacher) => teacher.userId) } },
    data: { isActive: false },
  });

  return teachersToDeactivate.length;
}

export async function syncCareerCatalogByExternalIds({
  importedCareerExternalIds,
}: CareerCatalogSyncParams): Promise<CareerCatalogCleanupResult> {
  if (importedCareerExternalIds.length === 0) {
    return {
      deactivatedCount: 0,
      removedCount: 0,
    };
  }

  const staleCareers = await prisma.career.findMany({
    where: {
      OR: [
        { externalId: null },
        { externalId: { notIn: importedCareerExternalIds } },
      ],
    },
    select: {
      id: true,
      isActive: true,
      _count: {
        select: {
          teachers: true,
          students: true,
          groups: true,
          subjects: true,
          careerHeadEvaluations: true,
        },
      },
    },
  });

  if (staleCareers.length === 0) {
    return {
      deactivatedCount: 0,
      removedCount: 0,
    };
  }

  const removableCareerIds = staleCareers
    .filter(
      (career) =>
        career._count.teachers === 0 &&
        career._count.students === 0 &&
        career._count.groups === 0 &&
        career._count.subjects === 0 &&
        career._count.careerHeadEvaluations === 0,
    )
    .map((career) => career.id);
  const removableCareerIdSet = new Set(removableCareerIds);

  const careerIdsToDeactivate = staleCareers
    .filter(
      (career) =>
        career.isActive && !removableCareerIdSet.has(career.id),
    )
    .map((career) => career.id);

  if (careerIdsToDeactivate.length > 0) {
    await prisma.career.updateMany({
      where: { id: { in: careerIdsToDeactivate } },
      data: { isActive: false },
    });
  }

  if (removableCareerIds.length > 0) {
    await prisma.career.deleteMany({
      where: { id: { in: removableCareerIds } },
    });
  }

  return {
    deactivatedCount: careerIdsToDeactivate.length,
    removedCount: removableCareerIds.length,
  };
}

export async function syncSubjectCatalogByCareer({
  careerIds,
  importedSubjectKeys,
}: SubjectCatalogSyncParams) {
  if (careerIds.length === 0) {
    return 0;
  }

  const subjects = await prisma.subject.findMany({
    where: {
      careerId: { in: careerIds },
      isActive: true,
    },
    select: { id: true, code: true, careerId: true },
  });

  const importedKeys = new Set(importedSubjectKeys);
  const subjectIdsToDeactivate = subjects
    .filter((subject) => !importedKeys.has(`${subject.careerId}:${subject.code}`))
    .map((subject) => subject.id);

  if (subjectIdsToDeactivate.length === 0) {
    return 0;
  }

  await prisma.subject.updateMany({
    where: { id: { in: subjectIdsToDeactivate } },
    data: { isActive: false },
  });

  return subjectIdsToDeactivate.length;
}

export async function syncGroupCatalogByCareerAndPeriod({
  careerIds,
  period,
  importedGroupKeys,
}: GroupCatalogSyncParams) {
  if (careerIds.length === 0 || !period) {
    return 0;
  }

  const groups = await prisma.group.findMany({
    where: {
      careerId: { in: careerIds },
      period,
      isActive: true,
      managedByExternal: true,
    },
    select: { id: true, careerId: true, externalId: true, name: true },
  });

  const importedKeys = new Set(importedGroupKeys);
  const groupIdsToDeactivate = groups
    .filter((group) => {
      const localKey = `${group.careerId}:${period}:${group.externalId ?? group.name.toUpperCase()}`;
      return !importedKeys.has(localKey);
    })
    .map((group) => group.id);

  if (groupIdsToDeactivate.length === 0) {
    return 0;
  }

  await prisma.group.updateMany({
    where: { id: { in: groupIdsToDeactivate } },
    data: { isActive: false },
  });

  return groupIdsToDeactivate.length;
}

export async function syncGroupAssignmentsByGroup({
  groupIds,
  importedAssignmentKeys,
}: GroupAssignmentCatalogSyncParams) {
  if (groupIds.length === 0) {
    return 0;
  }

  const assignments = await prisma.groupSubject.findMany({
    where: {
      groupId: { in: groupIds },
      managedByExternal: true,
    },
    select: { id: true, groupId: true, subjectId: true },
  });

  const importedKeys = new Set(importedAssignmentKeys);
  const assignmentIdsToDelete = assignments
    .filter(
      (assignment) =>
        !importedKeys.has(`${assignment.groupId}:${assignment.subjectId}`),
    )
    .map((assignment) => assignment.id);

  if (assignmentIdsToDelete.length === 0) {
    return 0;
  }

  await prisma.groupSubject.deleteMany({
    where: { id: { in: assignmentIdsToDelete } },
  });

  return assignmentIdsToDelete.length;
}

export async function replaceStudentEnrollmentForGroup(studentId: string, groupId: string) {
  const targetGroup = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, period: true },
  });

  if (!targetGroup) {
    return;
  }

  const existingSamePeriodEnrollments = await prisma.groupEnrollment.findMany({
    where: {
      studentId,
      group: {
        period: targetGroup.period,
      },
    },
    select: { id: true, groupId: true },
  });

  const enrollmentIdsToDelete = existingSamePeriodEnrollments
    .filter((enrollment) => enrollment.groupId !== groupId)
    .map((enrollment) => enrollment.id);

  if (enrollmentIdsToDelete.length > 0) {
    await prisma.groupEnrollment.deleteMany({
      where: { id: { in: enrollmentIdsToDelete } },
    });
  }

  await prisma.groupEnrollment.upsert({
    where: {
      studentId_groupId: {
        studentId,
        groupId,
      },
    },
    update: {},
    create: {
      studentId,
      groupId,
    },
  });
}

export async function clearStudentEnrollmentForPeriod(studentId: string, period: string) {
  const enrollments = await prisma.groupEnrollment.findMany({
    where: {
      studentId,
      group: {
        period,
      },
    },
    select: { id: true },
  });

  if (enrollments.length === 0) {
    return 0;
  }

  await prisma.groupEnrollment.deleteMany({
    where: { id: { in: enrollments.map((enrollment) => enrollment.id) } },
  });

  return enrollments.length;
}

export async function syncStudentRosterByPeriod({
  careerIds,
  period,
  expectedGroupByStudentId,
}: StudentPeriodSyncParams) {
  if (careerIds.length === 0) {
    return 0;
  }

  const targetGroups = await prisma.group.findMany({
    where: {
      careerId: { in: careerIds },
      period,
    },
    select: { id: true },
  });

  if (targetGroups.length === 0) {
    return 0;
  }

  const targetGroupIds = targetGroups.map((group) => group.id);
  const existingEnrollments = await prisma.groupEnrollment.findMany({
    where: {
      groupId: { in: targetGroupIds },
    },
    select: { id: true, studentId: true, groupId: true },
  });

  const enrollmentIdsToDelete = existingEnrollments
    .filter(
      (enrollment) =>
        expectedGroupByStudentId.get(enrollment.studentId) !== enrollment.groupId,
    )
    .map((enrollment) => enrollment.id);

  if (enrollmentIdsToDelete.length === 0) {
    return 0;
  }

  await prisma.groupEnrollment.deleteMany({
    where: { id: { in: enrollmentIdsToDelete } },
  });

  return enrollmentIdsToDelete.length;
}
