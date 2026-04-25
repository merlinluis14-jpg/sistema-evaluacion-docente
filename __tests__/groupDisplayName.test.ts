import {
  getGroupDisplayMetadata,
  getGroupDisplayName,
} from "@/lib/groupDisplayName";

describe("getGroupDisplayName", () => {
  it("genera alias para grupos de la carrera 14", () => {
    expect(getGroupDisplayName("10M141", "14")).toEqual({
      displayName: "10MSC1",
      hasAlias: true,
    });
    expect(getGroupDisplayName("10M142", "14")).toEqual({
      displayName: "10MSC2",
      hasAlias: true,
    });
    expect(getGroupDisplayName("7M141", "14")).toEqual({
      displayName: "7MSC1",
      hasAlias: true,
    });
    expect(getGroupDisplayName("7V143", "14")).toEqual({
      displayName: "7VSC3",
      hasAlias: true,
    });
  });

  it("genera alias para grupos de la carrera 21", () => {
    expect(getGroupDisplayName("1M211", "21")).toEqual({
      displayName: "1MTII1",
      hasAlias: true,
    });
    expect(getGroupDisplayName("1V212", "21")).toEqual({
      displayName: "1VTII2",
      hasAlias: true,
    });
    expect(getGroupDisplayName("1V213", "21")).toEqual({
      displayName: "1VTII3",
      hasAlias: true,
    });
  });

  it("conserva el nombre original si la carrera no tiene acronimo configurado", () => {
    expect(getGroupDisplayName("10M141", "99")).toEqual({
      displayName: "10M141",
      hasAlias: false,
    });
  });

  it("conserva el nombre original si el formato del grupo no coincide", () => {
    expect(getGroupDisplayName("GRUPO-LAB", "14")).toEqual({
      displayName: "GRUPO-LAB",
      hasAlias: false,
    });
  });

  it("conserva el nombre original si el codigo incrustado no coincide con la carrera real", () => {
    expect(getGroupDisplayName("10M141", "21")).toEqual({
      displayName: "10M141",
      hasAlias: false,
    });
  });

  it("expone una etiqueta accesible con el codigo interno cuando existe alias", () => {
    expect(getGroupDisplayMetadata("10M141", "14")).toEqual({
      displayName: "10MSC1",
      hasAlias: true,
      accessibilityLabel: "Grupo 10MSC1 (código interno: 10M141)",
    });
  });
});
