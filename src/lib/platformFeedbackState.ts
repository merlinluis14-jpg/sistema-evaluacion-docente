import { prisma } from "@/lib/prisma";
import {
  buildPlatformFeedbackEligibility,
  getUniqueAssignedSubjectIds,
} from "@/lib/platformFeedback";

export async function getStudentPlatformFeedbackState(studentId: string, periodId: string) {
  const [student, existingResponse] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: {
        groups: {
          select: {
            group: {
              select: {
                subjects: {
                  select: {
                    subjectId: true,
                  },
                },
              },
            },
          },
        },
        evaluations: {
          where: { periodId },
          select: {
            subjectId: true,
          },
        },
      },
    }),
    prisma.platformFeedbackResponse.findUnique({
      where: {
        studentId_periodId: {
          studentId,
          periodId,
        },
      },
      select: { id: true },
    }),
  ]);

  if (!student) {
    return {
      assignedSubjectIds: [],
      ...buildPlatformFeedbackEligibility({
        assignedSubjectIds: [],
        evaluatedSubjectIds: [],
        hasResponse: false,
      }),
    };
  }

  const assignedSubjectIds = getUniqueAssignedSubjectIds(student.groups ?? []);
  const evaluatedSubjectIds = (student.evaluations ?? []).map((evaluation) => evaluation.subjectId);

  return {
    assignedSubjectIds,
    ...buildPlatformFeedbackEligibility({
      assignedSubjectIds,
      evaluatedSubjectIds,
      hasResponse: Boolean(existingResponse),
    }),
  };
}
