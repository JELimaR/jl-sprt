import { describe, it, expect } from "vitest";
import { TournamentConfigStore } from "../TournamentConfigStore";
import { ITournamentConfig, IStageConfig } from "../../JSportModule/data";

// -----------------------------------------------------------------------------
// Helpers
//
// El store solo lee `idConfig` del torneo y `idConfig` de cada stage (vía
// getStagesOfTournament, que recorre phases[].stages[]). Construimos configs
// mínimos con esos campos y casteamos; el resto de la forma de ITournamentConfig
// no lo toca el store.
// -----------------------------------------------------------------------------
function stage(idConfig: string): IStageConfig {
  return { idConfig } as unknown as IStageConfig;
}

/** Config mínimo: un torneo con sus stages repartidos en una sola phase. */
function tournamentConfig(idConfig: string, stageIds: string[]): ITournamentConfig {
  return {
    idConfig,
    phases: [{ stages: stageIds.map(stage) }],
  } as unknown as ITournamentConfig;
}

// -----------------------------------------------------------------------------
// set / get / has
// -----------------------------------------------------------------------------
describe("TournamentConfigStore - set / get / has", () => {
  it("registra y recupera un config por su idConfig", () => {
    const store = new TournamentConfigStore();
    const cfg = tournamentConfig("confedA", ["confedA_g1"]);
    store.set(cfg);
    expect(store.get("confedA")).toBe(cfg);
    expect(store.has("confedA")).toBe(true);
  });

  it("get devuelve undefined y has false si no existe", () => {
    const store = new TournamentConfigStore();
    expect(store.get("nope")).toBeUndefined();
    expect(store.has("nope")).toBe(false);
  });

  it("set reemplaza el config previo con el mismo idConfig", () => {
    const store = new TournamentConfigStore();
    const a1 = tournamentConfig("A", ["A_s1"]);
    const a2 = tournamentConfig("A", ["A_s2"]);
    store.set(a1);
    store.set(a2);
    expect(store.get("A")).toBe(a2);
    expect(store.size).toBe(1);
  });
});

// -----------------------------------------------------------------------------
// keys / forEach / size / all / clear
// -----------------------------------------------------------------------------
describe("TournamentConfigStore - colección", () => {
  it("keys, size y all reflejan los configs registrados", () => {
    const store = new TournamentConfigStore();
    store.set(tournamentConfig("A", ["A_s1"]));
    store.set(tournamentConfig("B", ["B_s1"]));
    expect(store.size).toBe(2);
    expect(Array.from(store.keys()).sort()).toEqual(["A", "B"]);
    expect(store.all().map((c) => c.idConfig).sort()).toEqual(["A", "B"]);
  });

  it("forEach itera sobre los configs", () => {
    const store = new TournamentConfigStore();
    store.set(tournamentConfig("A", ["A_s1"]));
    store.set(tournamentConfig("B", ["B_s1"]));
    const seen: string[] = [];
    store.forEach((_, key) => seen.push(key));
    expect(seen.sort()).toEqual(["A", "B"]);
  });

  it("clear vacía el registro", () => {
    const store = new TournamentConfigStore();
    store.set(tournamentConfig("A", ["A_s1"]));
    store.clear();
    expect(store.size).toBe(0);
    expect(store.get("A")).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// getStageIndex — el índice stageId -> torneo, sobre TODOS los configs
// -----------------------------------------------------------------------------
describe("TournamentConfigStore - getStageIndex", () => {
  it("mapea cada stageId al torneo que lo contiene, aunque sean torneos distintos", () => {
    const store = new TournamentConfigStore();
    const a = tournamentConfig("A", ["A_g1", "A_po"]);
    const b = tournamentConfig("B", ["B_g1", "B_po"]);
    store.set(a);
    store.set(b);

    const index = store.getStageIndex();
    expect(index.get("A_g1")).toBe(a);
    expect(index.get("A_po")).toBe(a);
    expect(index.get("B_g1")).toBe(b);
    expect(index.get("B_po")).toBe(b);
  });

  it("recomputa el índice tras un set (invalida el cache)", () => {
    const store = new TournamentConfigStore();
    store.set(tournamentConfig("A", ["A_g1"]));
    expect(store.getStageIndex().get("A_g1")?.idConfig).toBe("A");
    // aún no existe B_g1
    expect(store.getStageIndex().has("B_g1")).toBe(false);

    store.set(tournamentConfig("B", ["B_g1"]));
    // tras el set, el índice debe reflejar el nuevo stage
    expect(store.getStageIndex().get("B_g1")?.idConfig).toBe("B");
  });
});

// -----------------------------------------------------------------------------
// findProducerTournament — resuelve un rankId (rs_/tr_) al torneo productor
// -----------------------------------------------------------------------------
describe("TournamentConfigStore - findProducerTournament", () => {
  it("resuelve rs_<stageId> al torneo que contiene ese stage (aunque sea otro torneo)", () => {
    const store = new TournamentConfigStore();
    const a = tournamentConfig("A", ["A_g1"]);
    const b = tournamentConfig("B", ["B_g1"]);
    store.set(a);
    store.set(b);
    // el torneo B consume rs_A_g1 (los 3ros de A): el productor es A
    expect(store.findProducerTournament("rs_A_g1")).toBe(a);
  });

  it("resuelve tr_<tournamentId> al torneo con ese idConfig", () => {
    const store = new TournamentConfigStore();
    const a = tournamentConfig("A", ["A_g1"]);
    store.set(a);
    expect(store.findProducerTournament("tr_A")).toBe(a);
  });

  it("devuelve undefined para orígenes no registrados o de otro prefijo (fr_/ini_)", () => {
    const store = new TournamentConfigStore();
    store.set(tournamentConfig("A", ["A_g1"]));
    expect(store.findProducerTournament("rs_desconocido")).toBeUndefined();
    expect(store.findProducerTournament("tr_desconocido")).toBeUndefined();
    expect(store.findProducerTournament("fr_F001")).toBeUndefined();
    expect(store.findProducerTournament("ini_A")).toBeUndefined();
  });
});
