import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/adminLog";
import { requireGlobalAdminScope } from "@/lib/adminScope";
import { getCareerByCodeForImport, normalizeCareerCode } from "@/lib/careers";
import {
  activateCareer,
  createCareer,
  deactivateCareer,
  updateCareer,
} from "@/app/admin/carreras/actions";
import { prisma } from "@/lib/prisma";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

jest.mock("@/lib/adminLog", () => ({
  logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/adminScope", () => ({
  requireGlobalAdminScope: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    career: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    teacher: { count: jest.fn() },
    student: { count: jest.fn() },
    subject: { count: jest.fn() },
    group: { count: jest.fn() },
  },
}));

describe("careers module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireGlobalAdminScope as jest.Mock).mockResolvedValue({
      userId: "admin_1",
      email: "admin@uptx.edu.mx",
      isGlobal: true,
      careerIds: [],
      careers: [],
    });
  });

  it("normaliza el codigo de carrera a mayusculas", () => {
    expect(normalizeCareerCode(" isc ")).toBe("ISC");
  });

  it("reactiva una carrera inactiva cuando vuelve a aparecer en importacion", async () => {
    (prisma.career.findUnique as jest.Mock).mockResolvedValue({
      id: "career_1",
      code: "ISC",
      isActive: false,
    });
    (prisma.career.update as jest.Mock).mockResolvedValue({
      id: "career_1",
      code: "ISC",
      isActive: true,
    });

    const result = await getCareerByCodeForImport("isc");

    expect(prisma.career.findUnique).toHaveBeenCalledWith({
      where: { code: "ISC" },
    });
    expect(prisma.career.update).toHaveBeenCalledWith({
      where: { id: "career_1" },
      data: { isActive: true },
    });
    expect(result).toEqual({ id: "career_1", code: "ISC", isActive: true });
  });

  it("bloquea la desactivacion cuando existen catalogos activos asociados", async () => {
    (prisma.career.findUnique as jest.Mock).mockResolvedValue({
      id: "career_1",
      code: "ISC",
      name: "Ingeniería en Sistemas Computacionales",
      isActive: true,
    });
    (prisma.teacher.count as jest.Mock).mockResolvedValue(1);
    (prisma.student.count as jest.Mock).mockResolvedValue(0);
    (prisma.subject.count as jest.Mock).mockResolvedValue(0);
    (prisma.group.count as jest.Mock).mockResolvedValue(0);

    const result = await deactivateCareer("career_1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("No se puede desactivar");
    expect(prisma.career.update).not.toHaveBeenCalled();
  });

  it("desactiva la carrera cuando no tiene catalogos activos", async () => {
    (prisma.career.findUnique as jest.Mock).mockResolvedValue({
      id: "career_1",
      code: "ISC",
      name: "Ingeniería en Sistemas Computacionales",
      isActive: true,
    });
    (prisma.teacher.count as jest.Mock).mockResolvedValue(0);
    (prisma.student.count as jest.Mock).mockResolvedValue(0);
    (prisma.subject.count as jest.Mock).mockResolvedValue(0);
    (prisma.group.count as jest.Mock).mockResolvedValue(0);

    const result = await deactivateCareer("career_1");

    expect(result).toEqual({ success: true });
    expect(prisma.career.update).toHaveBeenCalledWith({
      where: { id: "career_1" },
      data: { isActive: false },
    });
    expect(logAdminAction).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/carreras");
  });

  it("reactiva una carrera desde administracion", async () => {
    (prisma.career.findUnique as jest.Mock).mockResolvedValue({
      id: "career_1",
      code: "ISC",
      name: "Ingeniería en Sistemas Computacionales",
      isActive: false,
    });

    const result = await activateCareer("career_1");

    expect(result).toEqual({ success: true });
    expect(prisma.career.update).toHaveBeenCalledWith({
      where: { id: "career_1" },
      data: { isActive: true },
    });
  });

  it("crea una carrera nueva y redirige al listado", async () => {
    const formData = new FormData();
    formData.set("code", "isc");
    formData.set("name", "Ingeniería en Sistemas Computacionales");

    (prisma.career.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.career.create as jest.Mock).mockResolvedValue({
      id: "career_1",
      code: "ISC",
      name: "Ingeniería en Sistemas Computacionales",
    });

    await expect(createCareer(formData)).rejects.toThrow(
      "REDIRECT:/admin/carreras?success=creada",
    );
    expect(prisma.career.create).toHaveBeenCalledWith({
      data: {
        code: "ISC",
        name: "Ingeniería en Sistemas Computacionales",
        isActive: true,
      },
    });
  });

  it("actualiza el nombre de una carrera y redirige al listado", async () => {
    const formData = new FormData();
    formData.set("id", "career_1");
    formData.set("name", "Ingeniería en Sistemas y Software");

    (prisma.career.findUnique as jest.Mock).mockResolvedValue({
      id: "career_1",
      code: "ISC",
      name: "Ingeniería en Sistemas Computacionales",
    });

    await expect(updateCareer(formData)).rejects.toThrow(
      "REDIRECT:/admin/carreras?success=actualizada",
    );
    expect(prisma.career.update).toHaveBeenCalledWith({
      where: { id: "career_1" },
      data: { name: "Ingeniería en Sistemas y Software" },
    });
  });
});
