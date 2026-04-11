import { parseAndImportAlumnos } from "@/lib/csv/parseAlumnos";
import {
  replaceStudentEnrollmentForGroup,
  syncStudentRosterByPeriod,
} from "@/lib/catalogSync";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    career: { findUnique: jest.fn(), update: jest.fn() },
    group: { findFirst: jest.fn(), create: jest.fn() },
    user: { create: jest.fn(), update: jest.fn() },
    student: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/catalogSync", () => ({
  replaceStudentEnrollmentForGroup: jest.fn().mockResolvedValue(undefined),
  syncStudentRosterByPeriod: jest.fn().mockResolvedValue(0),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
}));

describe("parseAndImportAlumnos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reporta filas con campos requeridos faltantes", async () => {
    const csv = `matricula,nombre,apellido,carrera_code,grupo
,,,,,`;

    const result = await parseAndImportAlumnos(csv, "Periodo Test");

    expect(result.total).toBe(1);
    expect(result.success).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toContain("Campos requeridos faltantes");
  });

  it("reporta error si la carrera no existe", async () => {
    (prisma.career.findUnique as jest.Mock).mockResolvedValue(null);

    const csv = `matricula,nombre,apellido,carrera_code,grupo
220001,Juan,Perez,INVALID,3A`;

    const result = await parseAndImportAlumnos(csv, "Periodo Test");

    expect(result.success).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toContain("no existe en el catalogo");
  });

  it("importa al alumno y lo inscribe en un grupo ya sincronizado", async () => {
    (prisma.career.findUnique as jest.Mock).mockResolvedValue({ id: "career_1", isActive: true });
    (prisma.group.findFirst as jest.Mock).mockResolvedValue({ id: "group_1" });
    (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user_1" });
    (prisma.student.create as jest.Mock).mockResolvedValue({ id: "student_1" });

    const csv = `matricula,nombre,apellido,carrera_code,grupo
220002,Maria,Lopez,ISC,3A`;

    const result = await parseAndImportAlumnos(csv, "Periodo Test");

    expect(result.errors).toHaveLength(0);
    expect(result.success).toBe(1);
    expect(replaceStudentEnrollmentForGroup).toHaveBeenCalledWith("student_1", "group_1");
    expect(syncStudentRosterByPeriod).not.toHaveBeenCalled();
  });
});
