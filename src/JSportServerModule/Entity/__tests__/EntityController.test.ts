import { describe, it, expect } from "vitest";
import { SportServerAPI } from "../../../JSportServerModule";
import type {
  IContinentData, ICountryData, ITownData,
  IInstitutionData, IFederationData, IConfederationData,
} from "../../../JSportModule";

// -----------------------------------------------------------------------------
// EntityController — Paso 2 (sobre SportWorld): métodos completados, validación que
// lanza y paginación.
//
// El controller opera sobre el SportWorld del proceso (singleton del
// SportFactoryServer). Vitest aísla el registro de módulos por ARCHIVO, así que el
// mundo arranca limpio para este archivo. Para no depender del orden entre casos,
// cada `describe` siembra lo que necesita con ids propios; el estado se acumula
// dentro del archivo (igual que el mundo real), por eso se usan ids únicos.
// -----------------------------------------------------------------------------

const api = () => SportServerAPI().getEntityController();

// Geografía base compartida (continente 1 / país 10 en cont 1 / país 20 en cont 2 / towns).
function seedGeography() {
  const continents: IContinentData[] = [
    { i: "C1", n: "Cont 1", p: 1, a: 1 },
    { i: "C2", n: "Cont 2", p: 1, a: 1 },
  ];
  const countries: ICountryData[] = [
    { i: "P10", n: "País 10", r: "C1", p: 1, a: 1 },
    { i: "P20", n: "País 20", r: "C2", p: 1, a: 1 },
  ];
  const towns: ITownData[] = [
    { i: "T10", n: "Town 10", c: "P10", p: 1, a: 1 },
    { i: "T20", n: "Town 20", c: "P20", p: 1, a: 1 },
  ];
  api().loadGeogExampleData(continents, countries, towns);
}

const institution = (id: string, hq: string): IInstitutionData =>
  ({ i: id, n: `Inst ${id}`, sn: id, ab: id, hq, fd: 1, sp: "football" });

const federation = (id: string, country: string, hq: string, members: string[] = []): IFederationData =>
  ({ i: id, n: `Fed ${id}`, sn: id, aa: country, hq, fd: 1, fs: [], ms: members, lSys: {}, cSys: {}, rnks: {} });

const confederation = (id: string, continent: string, hq: string): IConfederationData =>
  ({ i: id, n: `Conf ${id}`, sn: id, aa: continent, hq, fd: 1, fs: [], ms: [] });

describe("EntityController - creación y queries by id", () => {
  it("crea instituciones y las recupera por id; null si no existe", () => {
    seedGeography();
    expect(api().createInstitution(institution("I1", "T10"))).toBe(true);

    const found = api().getInstitutionById("I1");
    expect(found?.i).toBe("I1");
    expect(found?.n).toBe("Inst I1");
    // Query tolerante: no existe -> null (no lanza).
    expect(api().getInstitutionById("NOPE")).toBeNull();
  });

  it("crear dos veces la misma institución devuelve false (id duplicado)", () => {
    expect(api().createInstitution(institution("I1", "T10"))).toBe(false);
  });

  it("crea federaciones y confederaciones y las recupera por id", () => {
    expect(api().createFederation(federation("F1", "P10", "T10"))).toBe(true);
    expect(api().createConfederation(confederation("CF1", "C1", "T10"))).toBe(true);

    expect(api().getFederationById("F1")?.i).toBe("F1");
    expect(api().getConfederationById("CF1")?.i).toBe("CF1");
    expect(api().getFederationById("NOPE")).toBeNull();
    expect(api().getConfederationById("NOPE")).toBeNull();
  });
});

describe("EntityController - validación que lanza en comandos", () => {
  it("createInstitution con town inexistente lanza", () => {
    expect(() => api().createInstitution(institution("IX", "TOWN_FANTASMA")))
      .toThrow(/no existe la ciudad "TOWN_FANTASMA"/);
  });

  it("createFederation con país inexistente lanza", () => {
    expect(() => api().createFederation(federation("FX", "PAIS_FANTASMA", "T10")))
      .toThrow(/no existe el país "PAIS_FANTASMA"/);
  });

  it("createFederation con institución miembro inexistente lanza", () => {
    expect(() => api().createFederation(federation("FY", "P10", "T10", ["INST_FANTASMA"])))
      .toThrow(/no existe la institución "INST_FANTASMA"/);
  });

  it("createConfederation con continente inexistente lanza", () => {
    expect(() => api().createConfederation(confederation("CFX", "CONT_FANTASMA", "T10")))
      .toThrow(/no existe el continente "CONT_FANTASMA"/);
  });
});

describe("EntityController - asociaciones", () => {
  it("associateInstitution: OK si la institución es del país de la federación", () => {
    // I1 (town T10 -> país P10) ; F1 (país P10). Mismo país -> OK.
    expect(api().associateInstitution("I1", "F1")).toBe(true);
  });

  it("associateInstitution: false si la institución es de otro país", () => {
    // Institución en país P20, federación F1 en país P10 -> rechazada.
    expect(api().createInstitution(institution("I2", "T20"))).toBe(true);
    expect(api().associateInstitution("I2", "F1")).toBe(false);
  });

  it("associateInstitution: lanza si la institución o la federación no existen", () => {
    expect(() => api().associateInstitution("NOPE", "F1"))
      .toThrow(/no existe la institución "NOPE"/);
    expect(() => api().associateInstitution("I1", "NOPE"))
      .toThrow(/no existe la federación "NOPE"/);
  });

  it("associateFederation: OK dentro del continente, false fuera, lanza si no existe", () => {
    // F1 (país P10, región C1) -> CF1 (continente C1): OK.
    expect(api().associateFederation("F1", "CF1")).toBe(true);
    // Federación de otro continente.
    expect(api().createFederation(federation("F2", "P20", "T20"))).toBe(true);
    expect(api().associateFederation("F2", "CF1")).toBe(false); // F2 región C2 != C1
    expect(() => api().associateFederation("NOPE", "CF1")).toThrow(/no existe la federación/);
  });
});

describe("EntityController - remove y paginación", () => {
  it("removeConfederation elimina y devuelve true; false si no existía", () => {
    expect(api().createConfederation(confederation("CF_DEL", "C1", "T10"))).toBe(true);
    expect(api().getConfederationById("CF_DEL")).not.toBeNull();
    expect(api().removeConfederation("CF_DEL")).toBe(true);
    expect(api().getConfederationById("CF_DEL")).toBeNull();
    expect(api().removeConfederation("CF_DEL")).toBe(false);
  });

  it("getFederations aplica offset/limit", () => {
    // Sembrar varias federaciones adicionales para paginar.
    for (let i = 0; i < 5; i++) {
      api().createFederation(federation(`PGF${i}`, "P10", "T10"));
    }
    const all = api().getFederations({});
    expect(all.length).toBeGreaterThanOrEqual(5);

    const firstTwo = api().getFederations({ limit: 2 });
    expect(firstTwo.length).toBe(2);

    const offset = api().getFederations({ offset: 2, limit: 2 });
    expect(offset.length).toBe(2);
    // offset distinto del inicio.
    expect(offset[0].i).not.toBe(firstTwo[0].i);

    // offset más allá del total -> vacío.
    expect(api().getFederations({ offset: 9999 }).length).toBe(0);
  });

  it("getInstitutions aplica offset/limit", () => {
    const all = api().getInstitutions({});
    const limited = api().getInstitutions({ limit: 1 });
    expect(limited.length).toBe(1);
    expect(all.length).toBeGreaterThanOrEqual(1);
  });
});
