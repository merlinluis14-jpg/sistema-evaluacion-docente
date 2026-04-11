import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/adminLog";
import {
  activateAdminAccount,
  createAdminAccount,
  updateAdminCareerScope,
} from "@/app/admin/administradores/actions";
import { getCurrentAdminScope } from "@/lib/adminScope";
import { prisma } from "@/lib/prisma";

jest.mock("bcryptjs", () => {
  const mockModule = {
    compare: jest.fn(),
    hash: jest.fn(),
  };

  return {
    __esModule: true,
    default: mockModule,
    ...mockModule,
  };
});

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/adminLog", () => ({
  logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/adminScope", () => ({
  getCurrentAdminScope: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    career: {
      findMany: jest.fn(),
    },
  },
}));

describe("administradores actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentAdminScope as jest.Mock).mockResolvedValue({
      userId: "admin_1",
      email: "admin@uptx.edu.mx",
      isGlobal: true,
      careerIds: [],
      careers: [],
    });
  });

  it("crea una cuenta administrativa global cuando la reautenticacion es valida", async () => {
    const formData = new FormData();
    formData.set("currentPassword", "AdminActual123");
    formData.set("email", "coordinacion@uptx.edu.mx");
    formData.set("password", "NuevoAdmin123");
    formData.set("confirmPassword", "NuevoAdmin123");
    formData.set("scopeMode", "global");

    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "admin_1",
      email: "admin@uptx.edu.mx",
      password: "hashed-admin",
      role: "ADMIN",
      isActive: true,
      adminHasGlobalScope: true,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.career.findMany as jest.Mock).mockResolvedValue([]);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-new-admin");
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "admin_2",
      email: "coordinacion@uptx.edu.mx",
    });

    const result = await createAdminAccount(formData);

    expect(result).toEqual({
      success: true,
      email: "coordinacion@uptx.edu.mx",
      isGlobalScope: true,
      careerNames: [],
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "coordinacion@uptx.edu.mx",
        password: "hashed-new-admin",
        role: "ADMIN",
        isActive: true,
        adminHasGlobalScope: true,
        adminCareerAccesses: undefined,
      },
      select: {
        id: true,
        email: true,
      },
    });
    expect(logAdminAction).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/administradores");
  });

  it("crea una cuenta administrativa restringida a carreras seleccionadas", async () => {
    const formData = new FormData();
    formData.set("currentPassword", "AdminActual123");
    formData.set("email", "isc@uptx.edu.mx");
    formData.set("password", "NuevoAdmin123");
    formData.set("confirmPassword", "NuevoAdmin123");
    formData.set("scopeMode", "assigned");
    formData.append("careerIds", "career_isc");
    formData.append("careerIds", "career_iro");

    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "admin_1",
      email: "admin@uptx.edu.mx",
      password: "hashed-admin",
      role: "ADMIN",
      isActive: true,
      adminHasGlobalScope: true,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.career.findMany as jest.Mock).mockResolvedValue([
      { id: "career_isc", code: "ISC", name: "Ingenieria en Sistemas Computacionales" },
      { id: "career_iro", code: "IRO", name: "Ingenieria en Robotica" },
    ]);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-new-admin");
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "admin_3",
      email: "isc@uptx.edu.mx",
    });

    const result = await createAdminAccount(formData);

    expect(result).toEqual({
      success: true,
      email: "isc@uptx.edu.mx",
      isGlobalScope: false,
      careerNames: [
        "Ingenieria en Robotica",
        "Ingenieria en Sistemas Computacionales",
      ],
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "isc@uptx.edu.mx",
        password: "hashed-new-admin",
        role: "ADMIN",
        isActive: true,
        adminHasGlobalScope: false,
        adminCareerAccesses: {
          create: [
            { careerId: "career_iro" },
            { careerId: "career_isc" },
          ],
        },
      },
      select: {
        id: true,
        email: true,
      },
    });
  });

  it("actualiza el alcance administrativo hacia carreras asignadas", async () => {
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "admin_1",
        email: "admin@uptx.edu.mx",
        password: "hashed-admin",
        role: "ADMIN",
        isActive: true,
        adminHasGlobalScope: true,
      })
      .mockResolvedValueOnce({
        id: "admin_2",
        email: "coordinacion@uptx.edu.mx",
        role: "ADMIN",
        isActive: true,
        adminHasGlobalScope: false,
      });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.career.findMany as jest.Mock).mockResolvedValue([
      { id: "career_isc", code: "ISC", name: "Ingenieria en Sistemas Computacionales" },
    ]);

    const result = await updateAdminCareerScope({
      targetUserId: "admin_2",
      currentPassword: "AdminActual123",
      scopeMode: "assigned",
      careerIds: ["career_isc"],
    });

    expect(result).toEqual({ success: true });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "admin_2" },
      data: {
        adminHasGlobalScope: false,
        adminCareerAccesses: {
          deleteMany: {},
          create: [{ careerId: "career_isc" }],
        },
      },
    });
  });

  it("rechaza carreras ya asignadas a otra jefatura activa", async () => {
    const formData = new FormData();
    formData.set("currentPassword", "AdminActual123");
    formData.set("email", "nuevo.jefe@uptx.edu.mx");
    formData.set("password", "NuevoAdmin123");
    formData.set("confirmPassword", "NuevoAdmin123");
    formData.set("scopeMode", "assigned");
    formData.append("careerIds", "career_isc");

    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "admin_1",
      email: "admin@uptx.edu.mx",
      password: "hashed-admin",
      role: "ADMIN",
      isActive: true,
      adminHasGlobalScope: true,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.career.findMany as jest.Mock).mockResolvedValue([
      { id: "career_isc", code: "ISC", name: "Ingenieria en Sistemas Computacionales" },
    ]);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: "admin_2",
        email: "jefatura.isc@uptx.edu.mx",
        username: null,
        adminCareerAccesses: [
          {
            career: {
              code: "ISC",
            },
          },
        ],
      },
    ]);

    const result = await createAdminAccount(formData);

    expect(result).toEqual({
      success: false,
      error: "Las siguientes carreras ya estan asignadas a otras jefaturas activas: ISC (jefatura.isc@uptx.edu.mx).",
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("reactiva una cuenta administrativa inactiva con la contrasena del admin principal", async () => {
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "admin_1",
        email: "admin@uptx.edu.mx",
        password: "hashed-admin",
        role: "ADMIN",
        isActive: true,
        adminHasGlobalScope: true,
      })
      .mockResolvedValueOnce({
        id: "admin_2",
        email: "coordinacion@uptx.edu.mx",
        role: "ADMIN",
        isActive: false,
      });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await activateAdminAccount({
      targetUserId: "admin_2",
      currentPassword: "AdminActual123",
    });

    expect(result).toEqual({ success: true });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "admin_2" },
      data: { isActive: true },
    });
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ACTIVATE",
        entity: "ADMIN",
        entityId: "admin_2",
      }),
    );
  });
});
