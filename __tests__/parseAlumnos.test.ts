import { parseAndImportAlumnos } from "@/lib/csv/parseAlumnos";
import { prisma } from "@/lib/prisma";
import { syncSubjectsForGroup } from "@/lib/groupAssignments";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    career: { findFirst: jest.fn() },
    group: { findFirst: jest.fn(), create: jest.fn() },
    user: { upsert: jest.fn() },
    student: { upsert: jest.fn() },
    groupEnrollment: { upsert: jest.fn() },
  },
}));

jest.mock("@/lib/groupAssignments", () => ({
  syncSubjectsForGroup: jest.fn().mockResolvedValue(0),
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
    (prisma.career.findFirst as jest.Mock).mockResolvedValue(null);

    const csv = `matricula,nombre,apellido,carrera_code,grupo
220001,Juan,Perez,INVALID,3A`;

    const result = await parseAndImportAlumnos(csv, "Periodo Test");

    expect(result.success).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toContain("no existe o no esta activa");
  });

  it("importa al alumno, lo inscribe en grupo y sincroniza materias del grupo", async () => {
    (prisma.career.findFirst as jest.Mock).mockResolvedValue({ id: "career_1" });
    (prisma.group.findFirst as jest.Mock).mockResolvedValue({ id: "group_1" });
    (prisma.user.upsert as jest.Mock).mockResolvedValue({ id: "user_1" });
    (prisma.student.upsert as jest.Mock).mockResolvedValue({ id: "student_1" });
    (prisma.groupEnrollment.upsert as jest.Mock).mockResolvedValue({});

    const csv = `matricula,nombre,apellido,carrera_code,grupo
220002,Maria,Lopez,ISC,3A`;

    const result = await parseAndImportAlumnos(csv, "Periodo Test");

    expect(result.errors).toHaveLength(0);
    expect(result.success).toBe(1);
    expect(syncSubjectsForGroup).toHaveBeenCalledWith("group_1", "career_1", "3A");
  });
});
