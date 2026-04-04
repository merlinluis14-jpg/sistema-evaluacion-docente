require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { performance } = require("node:perf_hooks");
const { Pool } = require("pg");

function getArgValue(name) {
  const arg = process.argv.find((item) => item.startsWith(`${name}=`));
  return arg ? arg.split("=")[1] : null;
}

function percentile(values, target) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((target / 100) * sorted.length) - 1),
  );

  return sorted[index];
}

async function main() {
  const students = Number.parseInt(getArgValue("--students") ?? "1000", 10);
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL no esta definida.");
  }

  if (!Number.isFinite(students) || students <= 0) {
    throw new Error("El parametro --students debe ser un entero positivo.");
  }

  const runId = `ca1-${Date.now()}`;
  const pool = new Pool({
    connectionString,
    max: 50,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const ids = {
    careerId: `${runId}-career`,
    teacherUserId: `${runId}-teacher-user`,
    teacherId: `${runId}-teacher`,
    periodId: `${runId}-period`,
    groupId: `${runId}-group`,
    subjectId: `${runId}-subject`,
  };

  const studentRows = Array.from({ length: students }, (_, index) => {
    const sequence = String(index + 1).padStart(4, "0");
    const userId = `${runId}-student-user-${sequence}`;
    const studentId = `${runId}-student-${sequence}`;
    const matricula = `${runId.toUpperCase()}-${sequence}`;

    return {
      userId,
      studentId,
      matricula,
      username: matricula,
      name: `Alumno ${sequence}`,
      lastName: "Benchmark",
    };
  });

  const cleanup = async () => {
    await prisma.evaluation.deleteMany({ where: { periodId: ids.periodId } });
    await prisma.groupEnrollment.deleteMany({ where: { groupId: ids.groupId } });
    await prisma.groupSubject.deleteMany({ where: { groupId: ids.groupId } });
    await prisma.subject.deleteMany({ where: { id: ids.subjectId } });
    await prisma.group.deleteMany({ where: { id: ids.groupId } });
    await prisma.student.deleteMany({
      where: { id: { in: studentRows.map((student) => student.studentId) } },
    });
    await prisma.teacher.deleteMany({ where: { id: ids.teacherId } });
    await prisma.period.deleteMany({ where: { id: ids.periodId } });
    await prisma.career.deleteMany({ where: { id: ids.careerId } });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            ids.teacherUserId,
            ...studentRows.map((student) => student.userId),
          ],
        },
      },
    });
  };

  try {
    const sharedPassword = await bcrypt.hash("Benchmark2026!", 10);

    await prisma.career.create({
      data: {
        id: ids.careerId,
        code: runId.toUpperCase().slice(0, 12),
        name: `Carrera Benchmark ${runId}`,
        isActive: true,
      },
    });

    await prisma.user.create({
      data: {
        id: ids.teacherUserId,
        email: `${runId}@benchmark.local`,
        password: sharedPassword,
        role: "DOCENTE",
        isActive: true,
      },
    });

    await prisma.teacher.create({
      data: {
        id: ids.teacherId,
        userId: ids.teacherUserId,
        name: "Docente",
        lastName: "Benchmark",
        employeeId: runId.toUpperCase(),
        careerId: ids.careerId,
        position: "PTC",
        isActive: true,
      },
    });

    await prisma.period.create({
      data: {
        id: ids.periodId,
        name: `Periodo Benchmark ${runId}`,
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: new Date("2026-12-31T23:59:59.999Z"),
        isActive: false,
      },
    });

    await prisma.group.create({
      data: {
        id: ids.groupId,
        name: "3A",
        period: `Benchmark ${runId}`,
        careerId: ids.careerId,
        isActive: true,
      },
    });

    await prisma.subject.create({
      data: {
        id: ids.subjectId,
        name: "Benchmark de Evaluacion",
        code: `BEN-${runId.slice(-6).toUpperCase()}`,
        cuatrimestre: 3,
        careerId: ids.careerId,
        teacherId: ids.teacherId,
        isActive: true,
      },
    });

    await prisma.groupSubject.create({
      data: {
        groupId: ids.groupId,
        subjectId: ids.subjectId,
      },
    });

    await prisma.user.createMany({
      data: studentRows.map((student) => ({
        id: student.userId,
        username: student.username,
        password: sharedPassword,
        role: "ALUMNO",
        isActive: true,
      })),
    });

    await prisma.student.createMany({
      data: studentRows.map((student) => ({
        id: student.studentId,
        userId: student.userId,
        matricula: student.matricula,
        name: student.name,
        lastName: student.lastName,
        careerId: ids.careerId,
        isActive: true,
      })),
    });

    await prisma.groupEnrollment.createMany({
      data: studentRows.map((student) => ({
        studentId: student.studentId,
        groupId: ids.groupId,
      })),
    });

    const latencies = [];
    const benchmarkStart = performance.now();

    await Promise.all(
      studentRows.map(async (student, index) => {
        const requestStart = performance.now();

        await prisma.evaluation.create({
          data: {
            studentId: student.studentId,
            teacherId: ids.teacherId,
            subjectId: ids.subjectId,
            periodId: ids.periodId,
            fac_item01: 4,
            fac_item02: 4,
            fac_item03: 4,
            fac_item04: 4,
            fac_item05: 4,
            fac_item06: 4,
            fac_item07: 4,
            fac_item08: 4,
            fac_item09: 4,
            fac_item10: 4,
            fac_item11: 4,
            hab_item01: 5,
            hab_item02: 5,
            hab_item03: 5,
            hab_item04: 5,
            med_item01: 5,
            med_item02: 5,
            med_item03: 5,
            med_item04: 5,
            med_item05: 5,
            med_item06: 5,
            teoriaPractica: 2,
            auto_item01: 5,
            auto_item02: 5,
            auto_item03: 5,
            auto_item04: 5,
            auto_item05: 5,
            auto_item06: 5,
            auto_item07: 5,
            auto_item08: 5,
            auto_item09: 5,
            auto_item10: 5,
            auto_item11: 5,
            comentario_fortalezas: `Comentario benchmark ${index + 1}`,
            comentario_adicional: null,
            isAnonymous: true,
          },
        });

        latencies.push(performance.now() - requestStart);
      }),
    );

    const totalTimeMs = performance.now() - benchmarkStart;
    const createdCount = await prisma.evaluation.count({
      where: { periodId: ids.periodId },
    });

    const averageLatencyMs = latencies.reduce((sum, value) => sum + value, 0) / latencies.length;
    const result = {
      runId,
      students,
      createdCount,
      totalTimeMs: Number(totalTimeMs.toFixed(2)),
      averageLatencyMs: Number(averageLatencyMs.toFixed(2)),
      minLatencyMs: Number(Math.min(...latencies).toFixed(2)),
      maxLatencyMs: Number(Math.max(...latencies).toFixed(2)),
      p95LatencyMs: Number(percentile(latencies, 95).toFixed(2)),
      throughputPerSecond: Number(((createdCount / totalTimeMs) * 1000).toFixed(2)),
      meetsCa1: createdCount >= students,
      meetsRnf4: averageLatencyMs < 2000,
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await cleanup().catch((error) => {
      console.error("No se pudo limpiar la data sintetica del benchmark:", error);
    });

    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Benchmark CA1 fallido:", error);
  process.exitCode = 1;
});
