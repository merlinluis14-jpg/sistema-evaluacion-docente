import {
  extractCuatrimestreFromGroupName,
  replaceGroupsForSubject,
  resolveManualGroupIdsForCareer,
} from "@/lib/groupAssignments";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    group: {
      findMany: jest.fn(),
    },
    groupSubject: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

describe("groupAssignments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("extrae el cuatrimestre desde el nombre del grupo", () => {
    expect(extractCuatrimestreFromGroupName("3A")).toBe(3);
    expect(extractCuatrimestreFromGroupName("10B")).toBe(10);
    expect(extractCuatrimestreFromGroupName("Grupo A")).toBeNull();
  });

  it("valida grupos manuales dentro de la misma carrera", async () => {
    (prisma.group.findMany as jest.Mock).mockResolvedValue([
      { id: "group_1", name: "5A" },
      { id: "group_2", name: "5B" },
    ]);

    const result = await resolveManualGroupIdsForCareer("career_1", ["group_1", "group_2"]);

    expect(result).toEqual(["group_1", "group_2"]);
    expect(prisma.group.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["group_1", "group_2"] },
        careerId: "career_1",
        isActive: true,
      },
      select: { id: true, name: true },
    });
  });

  it("rechaza grupos manuales cuando alguno no pertenece a la carrera activa", async () => {
    (prisma.group.findMany as jest.Mock).mockResolvedValue([{ id: "group_1", name: "5A" }]);

    const result = await resolveManualGroupIdsForCareer("career_1", ["group_1", "group_2"]);

    expect(result).toBeNull();
  });

  it("rechaza grupos manuales cuando no coinciden con el cuatrimestre", async () => {
    (prisma.group.findMany as jest.Mock).mockResolvedValue([
      { id: "group_1", name: "3A" },
      { id: "group_2", name: "5B" },
    ]);

    const result = await resolveManualGroupIdsForCareer(
      "career_1",
      ["group_1", "group_2"],
      5,
    );

    expect(result).toBeNull();
  });

  it("reemplaza completamente los grupos ligados a una materia", async () => {
    (prisma.groupSubject.createMany as jest.Mock).mockResolvedValue({ count: 2 });

    const result = await replaceGroupsForSubject("subject_1", ["group_1", "group_2"]);

    expect(result).toBe(2);
    expect(prisma.groupSubject.deleteMany).toHaveBeenCalledWith({
      where: { subjectId: "subject_1" },
    });
    expect(prisma.groupSubject.createMany).toHaveBeenCalledWith({
      data: [
        { groupId: "group_1", subjectId: "subject_1" },
        { groupId: "group_2", subjectId: "subject_1" },
      ],
      skipDuplicates: true,
    });
  });
});
