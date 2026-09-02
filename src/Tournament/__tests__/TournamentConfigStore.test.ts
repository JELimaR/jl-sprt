import { describe, it, expect } from "vitest";
import { TournamentConfigStore } from "../TournamentConfigStore";
import { ITournamentFromGSGData } from "../../JSportModule/GeneralStageGraph/tournamentFromGSG";
import { TInitialCreator, TPhaseCreator } from "../../JSportModule/GeneralStageGraph/GSGCreators";

// -----------------------------------------------------------------------------
// TournamentConfigStore
//
// La ÚNICA puerta de entrada pública es `set(creator)`: recibe el CREATOR del GSG,
// corre tournamentFromGSG (verificación individual completa) + verifyCoupledTournaments
// (cross-tournament) sobre el conjunto acumulado, registra el config y lo devuelve.
// El registro puro (`register`) es privado. Por eso todos estos tests construyen el
// estado del store con creators reales vía `set`.
//
// leagueCreator produce un torneo de una sola stage con id `<tournamentId>_p01_s01`.
// -----------------------------------------------------------------------------

const SEASON = 1156;

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

// -----------------------------------------------------------------------------
// set(creator) — verifica TODO al registrar (individual + cross-tournament)
// -----------------------------------------------------------------------------
describe("TournamentConfigStore - set(creator) verifica al registrar", () => {
  it("construye, verifica y registra el config; devuelve el config resultante", () => {
    const store = new TournamentConfigStore();
    const config = store.set(leagueCreator('S_D01'), SEASON);

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
    expect(() => store.set(bad, SEASON)).toThrow();
    // no quedó registrado el config inválido
    expect(store.has('BAD')).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// get / has
// -----------------------------------------------------------------------------
describe("TournamentConfigStore - get / has", () => {
  it("recupera un config por su idConfig tras registrarlo", () => {
    const store = new TournamentConfigStore();
    const cfg = store.set(leagueCreator('confedA'), SEASON);
    expect(store.get('confedA')).toBe(cfg);
    expect(store.has('confedA')).toBe(true);
  });

  it("get devuelve undefined y has false si no existe", () => {
    const store = new TournamentConfigStore();
    expect(store.get('nope')).toBeUndefined();
    expect(store.has('nope')).toBe(false);
  });

  it("set del mismo idConfig actualiza el config ACTUAL (get devuelve el último)", () => {
    const store = new TournamentConfigStore();
    const a1 = store.set(leagueCreator('A', 'fr_S_A'), SEASON);
    const a2 = store.set(leagueCreator('A', 'fr_S_A'), SEASON);
    expect(store.get('A')).toBe(a2);
    expect(store.get('A')).not.toBe(a1);
    expect(store.size).toBe(1);
  });
});

// -----------------------------------------------------------------------------
// keys / forEach / size / all / clear
// -----------------------------------------------------------------------------
describe("TournamentConfigStore - colección", () => {
  it("keys, size y all reflejan los configs registrados", () => {
    const store = new TournamentConfigStore();
    store.set(leagueCreator('A', 'fr_S_A'), SEASON);
    store.set(leagueCreator('B', 'fr_S_B'), SEASON);
    expect(store.size).toBe(2);
    expect(Array.from(store.keys()).sort()).toEqual(['A', 'B']);
    expect(store.all().map((c) => c.idConfig).sort()).toEqual(['A', 'B']);
  });

  it("forEach itera sobre los configs", () => {
    const store = new TournamentConfigStore();
    store.set(leagueCreator('A', 'fr_S_A'), SEASON);
    store.set(leagueCreator('B', 'fr_S_B'), SEASON);
    const seen: string[] = [];
    store.forEach((_, key) => seen.push(key));
    expect(seen.sort()).toEqual(['A', 'B']);
  });

  it("clear vacía el registro", () => {
    const store = new TournamentConfigStore();
    store.set(leagueCreator('A', 'fr_S_A'), SEASON);
    store.clear();
    expect(store.size).toBe(0);
    expect(store.get('A')).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// getStageIndex — el índice stageId -> torneo, sobre TODOS los configs
// -----------------------------------------------------------------------------
describe("TournamentConfigStore - getStageIndex", () => {
  it("mapea cada stageId al torneo que lo contiene, aunque sean torneos distintos", () => {
    const store = new TournamentConfigStore();
    const a = store.set(leagueCreator('A', 'fr_S_A'), SEASON);
    const b = store.set(leagueCreator('B', 'fr_S_B'), SEASON);

    const index = store.getStageIndex();
    // cada liga produce una stage `<id>_p01_s01`
    expect(index.get('A_p01_s01')).toBe(a);
    expect(index.get('B_p01_s01')).toBe(b);
  });

  it("recomputa el índice tras un set (invalida el cache)", () => {
    const store = new TournamentConfigStore();
    store.set(leagueCreator('A', 'fr_S_A'), SEASON);
    expect(store.getStageIndex().get('A_p01_s01')?.idConfig).toBe('A');
    // aún no existe la stage de B
    expect(store.getStageIndex().has('B_p01_s01')).toBe(false);

    store.set(leagueCreator('B', 'fr_S_B'), SEASON);
    // tras el set, el índice debe reflejar el nuevo stage
    expect(store.getStageIndex().get('B_p01_s01')?.idConfig).toBe('B');
  });
});

// -----------------------------------------------------------------------------
// findProducerTournament — resuelve un rankId (rs_/tr_) al torneo productor
// -----------------------------------------------------------------------------
describe("TournamentConfigStore - findProducerTournament", () => {
  it("resuelve rs_<stageId> al torneo que contiene ese stage", () => {
    const store = new TournamentConfigStore();
    const a = store.set(leagueCreator('A', 'fr_S_A'), SEASON);
    store.set(leagueCreator('B', 'fr_S_B'), SEASON);
    expect(store.findProducerTournament('rs_A_p01_s01')).toBe(a);
  });

  it("resuelve tr_<tournamentId> al torneo con ese idConfig", () => {
    const store = new TournamentConfigStore();
    const a = store.set(leagueCreator('A', 'fr_S_A'), SEASON);
    expect(store.findProducerTournament('tr_A')).toBe(a);
  });

  it("devuelve undefined para orígenes no registrados o de otro prefijo (fr_/ini_)", () => {
    const store = new TournamentConfigStore();
    store.set(leagueCreator('A', 'fr_S_A'), SEASON);
    expect(store.findProducerTournament('rs_desconocido')).toBeUndefined();
    expect(store.findProducerTournament('tr_desconocido')).toBeUndefined();
    expect(store.findProducerTournament('fr_F001')).toBeUndefined();
    expect(store.findProducerTournament('ini_A')).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// Historial — getHistory / getBySeason
//
// El mismo torneo (idConfig) puede registrarse en temporadas distintas con configs
// distintos (ej. una liga que crece de temporada a temporada). El historial NO
// pierde las versiones previas; `get` devuelve la actual, `getBySeason` la de una
// temporada dada.
// -----------------------------------------------------------------------------
describe("TournamentConfigStore - historial", () => {
  it("conserva todas las versiones de un torneo por temporada", () => {
    const store = new TournamentConfigStore();
    const v1156 = store.set(leagueCreator('S_D01'), 1156);
    const v1159 = store.set(leagueCreator('S_D01'), 1159);

    // el actual es el último registrado
    expect(store.get('S_D01')).toBe(v1159);

    // el historial conserva ambas versiones, con su temporada
    const hist = store.getHistory('S_D01');
    expect(hist.length).toBe(2);
    expect(hist.map((h) => h.season)).toEqual([1156, 1159]);
    expect(hist[0].config).toBe(v1156);
    expect(hist[1].config).toBe(v1159);
  });

  it("getBySeason devuelve el config tal como era en esa temporada", () => {
    const store = new TournamentConfigStore();
    const v1156 = store.set(leagueCreator('S_D01'), 1156);
    const v1159 = store.set(leagueCreator('S_D01'), 1159);

    expect(store.getBySeason('S_D01', 1156)).toBe(v1156);
    expect(store.getBySeason('S_D01', 1159)).toBe(v1159);
    // temporada sin versión registrada
    expect(store.getBySeason('S_D01', 1200)).toBeUndefined();
    // torneo inexistente
    expect(store.getBySeason('NOPE', 1156)).toBeUndefined();
  });

  it("getHistory de un torneo no registrado es vacío", () => {
    const store = new TournamentConfigStore();
    expect(store.getHistory('NOPE')).toEqual([]);
  });

  it("clear también borra el historial", () => {
    const store = new TournamentConfigStore();
    store.set(leagueCreator('S_D01'), 1156);
    store.clear();
    expect(store.getHistory('S_D01')).toEqual([]);
    expect(store.getBySeason('S_D01', 1156)).toBeUndefined();
  });
});
