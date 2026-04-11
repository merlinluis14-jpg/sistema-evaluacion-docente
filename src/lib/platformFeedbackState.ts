import { prisma } from "@/lib/prisma";
import {
  buildPlatformFeedbackEligibility,
  getUniqueAssignedGroupSubjectIds,
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
                    id: true,
                  },
                },
              },
            },
          },
        },
        evaluations: {
          where: { periodId },
          select: {
            groupSubjectId: true,
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
        assignedAssignmentIds: [],
        ...buildPlatformFeedbackEligibility({
          assignedAssignmentIds: [],
          evaluatedAssignmentIds: [],
          hasResponse: false,
        }),
      };
  }

  const assignedAssignmentIds = getUniqueAssignedGroupSubjectIds(student.groups ?? []);
  const evaluatedAssignmentIds = (student.evaluations ?? [])
    .map((evaluation) => evaluation.groupSubjectId)
    .filter((value): value is string => Boolean(value));

  return {
    assignedAssignmentIds,
    ...buildPlatformFeedbackEligibility({
      assignedAssignmentIds,
      evaluatedAssignmentIds,
      hasResponse: Boolean(existingResponse),
    }),
  };
}
