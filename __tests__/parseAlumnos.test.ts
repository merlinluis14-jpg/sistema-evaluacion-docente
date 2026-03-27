import { parseAndImportAlumnos } from "@/lib/csv/parseAlumnos";
import { prisma } from "@/lib/prisma";

// Mock de Prisma para no tocar la BD real
jest.mock("@/lib/prisma", () => ({
  prisma: {
    career: { findFirst: jest.fn() },
    group: { findFirst: jest.fn(), create: jest.fn() },
    user: { upsert: jest.fn() },
    student: { upsert: jest.fn() },
    groupEnrollment: { upsert: jest.fn() },
  }
}));

// Mock de bcrypt
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password")
}));

describe("parseAndImportAlumnos - Manejo de Errores CSV", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe identificar y reportar cuando faltan campos requeridos en la fila", async () => {
    const csv = `matricula,nombre,apellido,carrera_code,grupo
    ,,,,,`;
    
    const result = await parseAndImportAlumnos(csv, "Periodo Test");
    
    expect(result.total).toBe(1);
    expect(result.success).toBe(0);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].reason).toContain("Campos requeridos faltantes");
  });

  it("Debe reportar error si la carrera del alumno no existe en la base de datos", async () => {
    // Simulamos que la carrera no se encuentra
    (prisma.career.findFirst as jest.Mock).mockResolvedValue(null);
    
    const csv = `matricula,nombre,apellido,carrera_code,grupo
    220001,Juan,Perez,INVALID,3A`;
    
    const result = await parseAndImportAlumnos(csv, "Periodo Test");
    
    expect(result.success).toBe(0);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].reason).toContain("no existe o no está activa");
  });

  it("Debe lograr importar exitosamente una fila validada correctamente", async () => {
    // Simulamos un escenario de éxito
    (prisma.career.findFirst as jest.Mock).mockResolvedValue({ id: "car_1" });
    (prisma.group.findFirst as jest.Mock).mockResolvedValue({ id: "grp_1" });
    (prisma.user.upsert as jest.Mock).mockResolvedValue({ id: "usr_1" });
    (prisma.student.upsert as jest.Mock).mockResolvedValue({ id: "std_1" });
    (prisma.groupEnrollment.upsert as jest.Mock).mockResolvedValue({});

    const csv = `matricula,nombre,apellido,carrera_code,grupo
    220002,Maria,Lopez,ISC,3A`;
    
    const result = await parseAndImportAlumnos(csv, "Periodo Test");
    
    expect(result.errors.length).toBe(0);
    expect(result.success).toBe(1);
    expect(result.total).toBe(1);
    expect(prisma.student.upsert).toHaveBeenCalledTimes(1);
  });
});
