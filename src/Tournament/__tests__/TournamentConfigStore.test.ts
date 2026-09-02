import { describe, it, expect } from "vitest";
import { TournamentConfigStore } from "../TournamentConfigStore";
import { ITournamentConfig, IStageConfig } from "../../JSportModule/data";
import { ITournamentFromGSGData } from "../../JSportModule/GeneralStageGraph/tournamentFromGSG";
import { TInitialCreator, TPhaseCreator } from "../../JSportModule/GeneralStageGraph/GSGCreators";

// -----------------------------------------------------------------------------
// Helpers
//
// El registro (`register`) solo lee `idConfig` del torneo y `idConfig` de cada
// stage (vía getStagesOfTournament, que recorre phases[].stages[]). Construimos
// configs mínimos con esos campos y casteamos; el resto de la forma de
// ITournamentConfig no lo toca el registro.
//
// NOTA: estos tests usan `register` (inserción pura) para probar el índice y la
// colección de forma aislada. La verificación completa vive en `set(creator)`,
// que se cubre en los tests de integración (Tournament.create) y de acoplados.
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
describe("TournamentConfigStore - register / get / has", () => {
  it("registra y recupera un config por su idConfig", () => {
    const store = new TournamentConfigStore();
    const cfg = tournamentConfig("confedA", ["confedA_g1"]);
    store.register(cfg);
    expect(store.get("confedA")).toBe(cfg);
    expect(store.has("confedA")).toBe(true);
  });

  it("get devuelve undefined y has false si no existe", () => {
    const store = new TournamentConfigStore();
    expect(store.get("nope")).toBeUndefined();
    expect(store.has("nope")).toBe(false);
  });

  it("register reemplaza el config previo con el mismo idConfig", () => {
    const store = new TournamentConfigStore();
    const a1 = tournamentConfig("A", ["A_s1"]);
    const a2 = tournamentConfig("A", ["A_s2"]);
    store.register(a1);
    store.register(a2);
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
    store.register(tournamentConfig("A", ["A_s1"]));
    store.register(tournamentConfig("B", ["B_s1"]));
    expect(store.size).toBe(2);
    expect(Array.from(store.keys()).sort()).toEqual(["A", "B"]);
    expect(store.all().map((c) => c.idConfig).sort()).toEqual(["A", "B"]);
  });

  it("forEach itera sobre los configs", () => {
    const store = new TournamentConfigStore();
    store.register(tournamentConfig("A", ["A_s1"]));
    store.register(tournamentConfig("B", ["B_s1"]));
    const seen: string[] = [];
    store.forEach((_, key) => seen.push(key));
    expect(seen.sort()).toEqual(["A", "B"]);
  });

  it("clear vacía el registro", () => {
    const store = new TournamentConfigStore();
    store.register(tournamentConfig("A", ["A_s1"]));
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
    store.register(a);
    store.register(b);

    const index = store.getStageIndex();
    expect(index.get("A_g1")).toBe(a);
    expect(index.get("A_po")).toBe(a);
    expect(index.get("B_g1")).toBe(b);
    expect(index.get("B_po")).toBe(b);
  });

  it("recomputa el índice tras un set (invalida el cache)", () => {
    const store = new TournamentConfigStore();
    store.register(tournamentConfig("A", ["A_g1"]));
    expect(store.getStageIndex().get("A_g1")?.idConfig).toBe("A");
    // aún no existe B_g1
    expect(store.getStageIndex().has("B_g1")).toBe(false);

    store.register(tournamentConfig("B", ["B_g1"]));
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
    store.register(a);
    store.register(b);
    // el torneo B consume rs_A_g1 (los 3ros de A): el productor es A
    expect(store.findProducerTournament("rs_A_g1")).toBe(a);
  });

  it("resuelve tr_<tournamentId> al torneo con ese idConfig", () => {
    const store = new TournamentConfigStore();
    const a = tournamentConfig("A", ["A_g1"]);
    store.register(a);
    expect(store.findProducerTournament("tr_A")).toBe(a);
  });

  it("devuelve undefined para orígenes no registrados o de otro prefijo (fr_/ini_)", () => {
    const store = new TournamentConfigStore();
    store.register(tournamentConfig("A", ["A_g1"]));
    expect(store.findProducerTournament("rs_desconocido")).toBeUndefined();
    expect(store.findProducerTournament("tr_desconocido")).toBeUndefined();
    expect(store.findProducerTournament("fr_F001")).toBeUndefined();
    expect(store.findProducerTournament("ini_A")).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// set(creator) — verifica TODO al registrar (individual + cross-tournament)
//
// A diferencia de `register` (inserción pura), `set` recibe el CREATOR del GSG,
// corre tournamentFromGSG (verificación individual completa) y luego
// verifyCoupledTournaments sobre el conjunto acumulado (cross-tournament).
// -----------------------------------------------------------------------------

/** Creator de una liga de 8 equipos, ida y vuelta (config verificado en season.test). */
function leagueCreator(tournamentId: string, origin = 'fr_S_TEST'): ITournamentFromGSGData {
  const iniCreator: TInitialCreator = {
    tournamentId,
    qualyrankList: Array.from({ length: 8 }, (_, i) => ({ origin, pos: i + 1 })),
    rankGroupNumbers: [8],
  };
  const phaseArr: TPhaseCreator[] = [
    { id: 1, stages: [{ count: 1, stage: { type: 'group', opt: 'h&a', value: 1 } }] },
  ];
  return {
    name: tournamentId,
    gsgData: { initialCreator: iniCreator, phaseArr },
    matchList: [28, 32, 36, 40, 44, 48, 52, 70, 74, 78, 82, 86, 90, 94],
    schedList: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
    qualyRules: [],
  };
}

describe("TournamentConfigStore - set(creator) verifica al registrar", () => {
  it("construye, verifica y registra el config; devuelve el config resultante", () => {
    const store = new TournamentConfigStore();
    const config = store.set(leagueCreator('S_D01'));

    // el config volvió construido y quedó registrado por su idConfig
    expect(config.idConfig).toBe('S_D01');
    expect(store.has('S_D01')).toBe(true);
    expect(store.get('S_D01')).toBe(config);
    expect(config.phases.length).toBeGreaterThan(0);
  });

  it("lanza (verificación individual) si el creator está mal definido", () => {
    const store = new TournamentConfigStore();
    // playoff con participantes no divisibles por 2^rounds -> tournamentFromGSG lanza
    const bad: ITournamentFromGSGData = {
      name: 'BAD',
      gsgData: {
        initialCreator: {
          tournamentId: 'BAD',
          qualyrankList: Array.from({ length: 6 }, (_, i) => ({ origin: 'fr_S_TEST', pos: i + 1 })),
          rankGroupNumbers: [6],
        },
        phaseArr: [{ id: 1, stages: [{ count: 1, stage: { type: 'playoff', opt: 'h&a', value: 3 } }] }],
      },
      matchList: [10, 20, 30, 40, 50, 60],
      schedList: [1, 1, 1, 1, 1, 1],
      qualyRules: [],
    };
    expect(() => store.set(bad)).toThrow();
    // no quedó registrado el config inválido
    expect(store.has('BAD')).toBe(false);
  });

  it("registra dos torneos independientes sin lanzar (sin dependencias cross)", () => {
    const store = new TournamentConfigStore();
    store.set(leagueCreator('S_D01', 'fr_S_A'));
    store.set(leagueCreator('S_D02', 'fr_S_B'));
    expect(store.size).toBe(2);
  });
});
