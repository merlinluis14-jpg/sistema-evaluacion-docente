import { prisma } from "@/lib/prisma";

type TeacherCatalogSyncParams = {
  careerIds: string[];
  importedEmployeeIds: string[];
};

type SubjectCatalogSyncParams = {
  careerIds: string[];
  importedSubjectKeys: string[];
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
