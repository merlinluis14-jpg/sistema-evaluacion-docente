import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/adminLog";
import {
  activateAdminAccount,
  createAdminAccount,
} from "@/app/admin/administradores/actions";
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

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/adminLog", () => ({
  logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("administradores actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin_1", role: "ADMIN" },
    });
  });

  it("crea una cuenta administrativa cuando la reautenticacion es valida", async () => {
    const formData = new FormData();
    formData.set("currentPassword", "AdminActual123");
    formData.set("email", "coordinacion@uptx.edu.mx");
    formData.set("password", "NuevoAdmin123");
    formData.set("confirmPassword", "NuevoAdmin123");

    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "admin_1",
      email: "admin@uptx.edu.mx",
      password: "hashed-admin",
      role: "ADMIN",
      isActive: true,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-new-admin");
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "admin_2",
      email: "coordinacion@uptx.edu.mx",
    });

    const result = await createAdminAccount(formData);

    expect(result).toEqual({ success: true, email: "coordinacion@uptx.edu.mx" });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "coordinacion@uptx.edu.mx",
        password: "hashed-new-admin",
        role: "ADMIN",
        isActive: true,
      },
      select: {
        id: true,
        email: true,
      },
    });
    expect(logAdminAction).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/administradores");
  });

  it("reactiva una cuenta administrativa inactiva con la contrasena del admin autenticado", async () => {
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "admin_1",
        email: "admin@uptx.edu.mx",
        password: "hashed-admin",
        role: "ADMIN",
        isActive: true,
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

  it("rechaza la reactivacion cuando la contrasena de autorizacion no coincide", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "admin_1",
      email: "admin@uptx.edu.mx",
      password: "hashed-admin",
      role: "ADMIN",
      isActive: true,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await activateAdminAccount({
      targetUserId: "admin_2",
      currentPassword: "incorrecta",
    });

    expect(result).toEqual({
      success: false,
      error: "La contrasena actual del administrador no es correcta",
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
