/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env.local"),
});
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const globalAdmins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        isActive: true,
        adminHasGlobalScope: true,
      },
      select: {
        id: true,
        email: true,
      },
      orderBy: { email: "asc" },
    });

    if (globalAdmins.length === 0) {
      throw new Error(
        "No se encontro una cuenta admin global activa para conservar.",
      );
    }

    const [
      removableAdmins,
      students,
      localTeachers,
      localSubjects,
      localGroups,
      localOnlyCareers,
    ] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "ADMIN",
          id: { notIn: globalAdmins.map((admin) => admin.id) },
        },
        select: { id: true, email: true, isActive: true },
        orderBy: { email: "asc" },
      }),
      prisma.student.findMany({
        select: { id: true, userId: true, matricula: true },
        orderBy: { matricula: "asc" },
      }),
      prisma.teacher.findMany({
        where: { managedByExternal: false },
        select: { id: true, userId: true, employeeId: true },
        orderBy: { employeeId: "asc" },
      }),
      prisma.subject.findMany({
        where: { managedByExternal: false },
        select: { id: true, code: true },
        orderBy: { code: "asc" },
      }),
      prisma.group.findMany({
        where: { managedByExternal: false },
        select: { id: true, name: true, period: true },
        orderBy: [{ period: "asc" }, { name: "asc" }],
      }),
      prisma.career.findMany({
        where: { externalId: null },
        select: { id: true, code: true, name: true },
        orderBy: { code: "asc" },
      }),
    ]);

    const removableAdminIds = removableAdmins.map((admin) => admin.id);
    const studentIds = students.map((student) => student.id);
    const studentUserIds = students.map((student) => student.userId);
    const localTeacherIds = localTeachers.map((teacher) => teacher.id);
    const localTeacherUserIds = localTeachers.map((teacher) => teacher.userId);
    const localSubjectIds = localSubjects.map((subject) => subject.id);
    const localGroupIds = localGroups.map((group) => group.id);
    const localCareerIds = localOnlyCareers.map((career) => career.id);

    await prisma.$transaction(async (tx) => {
      if (studentIds.length > 0) {
        await tx.evaluation.deleteMany({
          where: { studentId: { in: studentIds } },
        });
        await tx.platformFeedbackResponse.deleteMany({
          where: { studentId: { in: studentIds } },
        });
      }

      if (localTeacherIds.length > 0) {
        await tx.evaluation.deleteMany({
          where: { teacherId: { in: localTeacherIds } },
        });
        await tx.careerHeadEvaluation.deleteMany({
          where: { teacherId: { in: localTeacherIds } },
        });
        await tx.groupSubject.updateMany({
          where: { teacherId: { in: localTeacherIds } },
          data: { teacherId: null },
        });
        await tx.subject.updateMany({
          where: { teacherId: { in: localTeacherIds } },
          data: { teacherId: null },
        });
      }

      if (localSubjectIds.length > 0) {
        await tx.evaluation.deleteMany({
          where: { subjectId: { in: localSubjectIds } },
        });
        await tx.groupSubject.deleteMany({
          where: { subjectId: { in: localSubjectIds } },
        });
      }

      if (localGroupIds.length > 0) {
        await tx.groupEnrollment.deleteMany({
          where: { groupId: { in: localGroupIds } },
        });
        await tx.groupSubject.deleteMany({
          where: { groupId: { in: localGroupIds } },
        });
      }

      if (studentIds.length > 0) {
        await tx.groupEnrollment.deleteMany({
          where: { studentId: { in: studentIds } },
        });
        await tx.student.deleteMany({
          where: { id: { in: studentIds } },
        });
      }

      if (studentUserIds.length > 0) {
        await tx.user.deleteMany({
          where: { id: { in: studentUserIds } },
        });
      }

      if (localSubjectIds.length > 0) {
        await tx.subject.deleteMany({
          where: { id: { in: localSubjectIds } },
        });
      }

      if (localGroupIds.length > 0) {
        await tx.group.deleteMany({
          where: { id: { in: localGroupIds } },
        });
      }

      if (localTeacherIds.length > 0) {
        await tx.teacher.deleteMany({
          where: { id: { in: localTeacherIds } },
        });
      }

      if (localTeacherUserIds.length > 0) {
        await tx.user.deleteMany({
          where: { id: { in: localTeacherUserIds } },
        });
      }

      if (removableAdminIds.length > 0) {
        await tx.user.deleteMany({
          where: { id: { in: removableAdminIds } },
        });
      }

      if (localCareerIds.length > 0) {
        await tx.career.deleteMany({
          where: { id: { in: localCareerIds } },
        });
      }
    });

    const remainingSummary = {
      admins: await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: {
          email: true,
          isActive: true,
          adminHasGlobalScope: true,
        },
        orderBy: { email: "asc" },
      }),
      counts: {
        careers: await prisma.career.count(),
        teachers: await prisma.teacher.count(),
        subjects: await prisma.subject.count(),
        groups: await prisma.group.count(),
        students: await prisma.student.count(),
        adminUsers: await prisma.user.count({ where: { role: "ADMIN" } }),
        teacherUsers: await prisma.user.count({ where: { role: "DOCENTE" } }),
        studentUsers: await prisma.user.count({ where: { role: "ALUMNO" } }),
      },
    };

    console.log(
      JSON.stringify(
        {
          preservedGlobalAdmins: globalAdmins,
          removed: {
            admins: removableAdmins.map((admin) => admin.email),
            students: students.map((student) => student.matricula),
            localTeachers: localTeachers.map((teacher) => teacher.employeeId),
            localSubjects: localSubjects.map((subject) => subject.code),
            localGroups: localGroups.map(
              (group) => `${group.period} :: ${group.name}`,
            ),
            localCareers: localOnlyCareers.map((career) => career.code),
          },
          remainingSummary,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
