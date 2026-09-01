import { describe, it, expect, beforeEach } from "vitest";
import { JCalendar, JDateTime, JDate } from "jl-calendar";
import { TInitialCreator, TPhaseCreator } from "../../JSportModule/GeneralStageGraph/GSGCreators";
import { ITournamentFromGSGData } from "../../JSportModule/GeneralStageGraph/tournamentFromGSG";
import { FootballProfile } from "../../JSportModule/profiles/football/FootballProfile";
import { SimulationContext } from "../SimulationContext";
import Tournament from "../Tournament";
import { teamsAssign } from "../teamsAssign";
import { Ranking } from "../../JSportModule/Ranking";
import { IRankItem } from "../../JSportModule/Ranking/interfaces";
import Team from "../../JSportModule/data/Team";
import { reseedRandom } from "../../JSportModule/Match/randomSource";

const SEED = 13;
const SEASON = 1156;
const N = 8;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function fakeTeam(id: string): Team {
  return { id } as unknown as Team;
}

/** Ranking bloqueado (poblado) de N posiciones, con teams sintéticos. */
function blockedRanking(context: string, n: number): Ranking {
  const arr: IRankItem[] = [];
  for (let p = 1; p <= n; p++) {
    arr.push({ origin: context, pos: p, team: fakeTeam(`${context}_T${p}`), score: n - p });
  }
  return Ranking.fromRankItemArr(context, arr);
}

/** Config de liga de 8 equipos cuyo qualyRankList proviene de un único origen. */
function ligConfig(tournamentId: string, origin: string): ITournamentFromGSGData {
  const iniCreator: TInitialCreator = {
    tournamentId,
    qualyrankList: Array.from({ length: N }, (_, i) => ({ origin, pos: i + 1 })),
    rankGroupNumbers: [N],
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

function newCtx(): SimulationContext {
  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, SEASON).getIJDateTimeCreator());
  return new SimulationContext(cal);
}

// -----------------------------------------------------------------------------
// Caso sin diferidos: resuelve el ini_ inmediatamente
// -----------------------------------------------------------------------------
describe("teamsAssign - sin orígenes diferidos", () => {
  beforeEach(() => reseedRandom(SEED));

  it("resuelve y guarda ini_<id> de inmediato cuando el origen ya está en el store", () => {
    const ctx = newCtx();
    // el origen fr_S_FTEST ya está disponible
    ctx.store.set('fr_S_FTEST', blockedRanking('fr_S_FTEST', N));

    const t = Tournament.create({ id: 'S_D01', season: SEASON }, ligConfig('S_D01', 'fr_S_FTEST'), ctx, new FootballProfile());
    teamsAssign(t, ctx);

    const ini = ctx.store.get('ini_S_D01');
    expect(ini).toBeDefined();
    expect(ini!.isBlocked).toBe(true);
    expect(ini!.size).toBe(N);
  });

  it("puebla el ini_ con los teams del origen en orden de posición", () => {
    const ctx = newCtx();
    ctx.store.set('fr_S_FTEST', blockedRanking('fr_S_FTEST', N));

    const t = Tournament.create({ id: 'S_D01', season: SEASON }, ligConfig('S_D01', 'fr_S_FTEST'), ctx, new FootballProfile());
    teamsAssign(t, ctx);

    const teams = ctx.store.get('ini_S_D01')!.getRankTable().map((r) => r.team.id);
    expect(teams).toEqual(Array.from({ length: N }, (_, i) => `fr_S_FTEST_T${i + 1}`));
  });
});

// -----------------------------------------------------------------------------
// Caso diferido: el origen rs_ llega después (durante la "simulación")
// -----------------------------------------------------------------------------
describe("teamsAssign - con origen diferido", () => {
  beforeEach(() => reseedRandom(SEED));

  it("NO guarda ini_<id> hasta que el origen diferido llega al store", () => {
    const ctx = newCtx();
    // el origen rs_PROD NO está todavía
    const t = Tournament.create({ id: 'S_DEF', season: SEASON }, ligConfig('S_DEF', 'rs_PROD'), ctx, new FootballProfile());
    teamsAssign(t, ctx);

    // aún no debe existir el ini_
    expect(ctx.store.has('ini_S_DEF')).toBe(false);
  });

  it("completa ini_<id> cuando el origen diferido se escribe en el store", () => {
    const ctx = newCtx();
    const t = Tournament.create({ id: 'S_DEF', season: SEASON }, ligConfig('S_DEF', 'rs_PROD'), ctx, new FootballProfile());
    teamsAssign(t, ctx);
    expect(ctx.store.has('ini_S_DEF')).toBe(false);

    // llega el ranking productor (simula el Event_StageEnd del productor)
    ctx.store.set('rs_PROD', blockedRanking('rs_PROD', N));

    const ini = ctx.store.get('ini_S_DEF');
    expect(ini).toBeDefined();
    expect(ini!.isBlocked).toBe(true);
    expect(ini!.size).toBe(N);
    // los teams del ini vienen del ranking productor
    expect(ini!.getRankTable().map((r) => r.team.id)).toEqual(
      Array.from({ length: N }, (_, i) => `rs_PROD_T${i + 1}`)
    );
  });

  it("espera a TODOS los orígenes: no completa con solo uno de dos diferidos", () => {
    const ctx = newCtx();
    // qualyRankList mezcla dos orígenes diferidos: rs_A (pos 1..4) y rs_B (pos 1..4)
    const iniCreator: TInitialCreator = {
      tournamentId: 'S_MIX',
      qualyrankList: [
        ...Array.from({ length: 4 }, (_, i) => ({ origin: 'rs_A', pos: i + 1 })),
        ...Array.from({ length: 4 }, (_, i) => ({ origin: 'rs_B', pos: i + 1 })),
      ],
      rankGroupNumbers: [N],
    };
    const data: ITournamentFromGSGData = {
      name: 'S_MIX',
      gsgData: { initialCreator: iniCreator, phaseArr: [{ id: 1, stages: [{ count: 1, stage: { type: 'group', opt: 'h&a', value: 1 } }] }] },
      matchList: [28, 32, 36, 40, 44, 48, 52, 70, 74, 78, 82, 86, 90, 94],
      schedList: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
      qualyRules: [],
    };
    const t = Tournament.create({ id: 'S_MIX', season: SEASON }, data, ctx, new FootballProfile());
    teamsAssign(t, ctx);

    // solo llega rs_A: todavía falta rs_B
    ctx.store.set('rs_A', blockedRanking('rs_A', 4));
    expect(ctx.store.has('ini_S_MIX')).toBe(false);

    // llega rs_B: ahora sí se completa
    ctx.store.set('rs_B', blockedRanking('rs_B', 4));
    expect(ctx.store.has('ini_S_MIX')).toBe(true);
    expect(ctx.store.get('ini_S_MIX')!.size).toBe(N);
  });
});
