import { describe, it, expect, beforeEach } from "vitest";
import { JCalendar, JDateTime } from "jl-calendar";
import { TInitialCreator, TPhaseCreator } from "../../JSportModule/GeneralStageGraph/GSGCreators";
import { ITournamentFromGSGData } from "../../JSportModule/GeneralStageGraph/tournamentFromGSG";
import { FootballProfile } from "../../JSportModule/profiles/football/FootballProfile";
import { SimulationContext } from "../SimulationContext";
import Tournament from "../Tournament";
import { teamsAssign } from "../teamsAssign";
import { Ranking } from "../../JSportModule/Ranking";
import { IRankItem } from "../../JSportModule/Ranking/interfaces";
import Team, { TeamMatch } from "../../JSportModule/data/Team";
import { reseedRandom } from "../../JSportModule/Match/randomSource";

// -----------------------------------------------------------------------------
// Capa 5 — Tournament / Phase (ranking final)
//
// Foco: getRelativeRank del torneo, en particular la RE-NUMERACIÓN GLOBAL de pos
// (regresión del fix): cuando la última fase concatena varios rank groups (una
// eliminatoria produce [finalistas, perd_semi, ...] + ramas arrastradas), el ranking
// final debe tener pos 1..N sin repetidos. Antes cada rama traía su pos relativo.
//
// Determinista con reseedRandom(SEED).
// -----------------------------------------------------------------------------

const SEED = 13;
const SEASON = 2000;

/** Team con lo mínimo que usa el pipeline (id + hooks de match/stage). */
function fakeTeam(id: string): Team {
  const t: Partial<Team> = {
    id,
    entity: { id } as any,
    getTeamMatch: () => new TeamMatch(id),
    addNewMatch: () => {},
    addStage: () => {},
  };
  return t as unknown as Team;
}

/** Ranking bloqueado (poblado) de N teams sintéticos, como fuente fr_. */
function blockedRanking(context: string, n: number): Ranking {
  const arr: IRankItem[] = [];
  for (let p = 1; p <= n; p++) {
    arr.push({ origin: context, pos: p, team: fakeTeam(`${context}_T${p}`), score: n - p });
  }
  return Ranking.fromRankItemArr(context, arr);
}

function advanceCalendar(cal: JCalendar): void {
  let guard = 0;
  while (cal.getNextEvents().events.length !== 0) {
    const { dt, events } = cal.getNextEvents();
    cal.now = dt;
    events.forEach((e) => e.execute());
    if (++guard > 100000) throw new Error('advanceCalendar loop');
  }
}

/**
 * Torneo multi-fase: grupo de 8 (una sola liga) -> playoff de 3 rondas sobre los 8
 * (octavos->cuartos->semis... acá 8 -> [2 finalistas, 2 perd, 4 perd]) -> final.
 * La última fase concatena varios rank groups, que es donde el fix de pos importa.
 */
function multiPhaseConfig(): ITournamentFromGSGData {
  const iniCreator: TInitialCreator = {
    tournamentId: 'T5',
    qualyrankList: Array.from({ length: 4 }, (_, i) => ({ origin: 'fr_SRC', pos: i + 1 })),
    rankGroupNumbers: [4],
  };
  const phaseArr: TPhaseCreator[] = [
    // Fase 1: grupo único de 4 (value:1 = 1 grupo) -> 4 rank groups (uno por posición).
    { id: 1, stages: [{ count: 1, stage: { type: 'group', value: 1, opt: 'h&a' } }] },
    // Fase 2 (última): playoff de 2 rondas sobre los 4 (consume los 4 rank groups).
    // 4 teams, 2 rondas -> [finalistas(2), perd_semi(2)] = 2 RG.
    // Al ser la última fase, su ranking concatena esos 2 rank groups -> es el caso
    // donde el fix de pos importa (antes cada RG traía su pos relativo).
    { id: 2, stages: [{ count: 4, stage: { type: 'playoff', value: 2, opt: 'h&a' } }] },
  ];
  return {
    name: 'T5',
    gsgData: { initialCreator: iniCreator, phaseArr },
    // grupo de 4 h&a = 6 fechas; playoff 2 rondas h&a = 4 fechas.
    matchList: [10, 12, 14, 16, 18, 20, /*po*/ 26, 28, 34, 36],
    schedList: [8, 8, 8, 8, 8, 8, /*po*/ 24, 24, 32, 32],
    qualyRules: [],
  };
}

/** Liga simple de 8 (una fase), para los tests de create/qualy/context. */
function ligaConfig(): ITournamentFromGSGData {
  const iniCreator: TInitialCreator = {
    tournamentId: 'LIG',
    qualyrankList: Array.from({ length: 8 }, (_, i) => ({ origin: 'fr_SRC', pos: i + 1 })),
    rankGroupNumbers: [8],
  };
  return {
    name: 'LIG',
    gsgData: { initialCreator: iniCreator, phaseArr: [{ id: 1, stages: [{ count: 1, stage: { type: 'group', value: 1, opt: 'h&a' } }] }] },
    matchList: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
    schedList: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    qualyRules: [],
  };
}

function newCtx(): SimulationContext {
  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, SEASON).getIJDateTimeCreator());
  return new SimulationContext(cal);
}

// -----------------------------------------------------------------------------
// Tournament.create y coherencia del GSG
// -----------------------------------------------------------------------------
describe("Tournament - create / graph", () => {
  beforeEach(() => reseedRandom(SEED));

  it("create arma las phases desde la config", () => {
    const ctx = newCtx();
    ctx.store.set('fr_SRC', blockedRanking('fr_SRC', 8));
    const t = Tournament.create({ id: 'LIG', season: SEASON }, ligaConfig(), ctx, new FootballProfile());
    expect(t.phases.length).toBe(1);
  });

  it("qualyGenericRankItemList coincide con el qualyRankList del GSG (8 items de fr_SRC)", () => {
    const ctx = newCtx();
    ctx.store.set('fr_SRC', blockedRanking('fr_SRC', 8));
    const t = Tournament.create({ id: 'LIG', season: SEASON }, ligaConfig(), ctx, new FootballProfile());
    const list = t.qualyGenericRankItemList;
    expect(list.length).toBe(8);
    expect(list.every((i) => i.origin === 'fr_SRC')).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// getRelativeRank: context tr_, metadata, y pos GLOBAL 1..N sin repetidos
// -----------------------------------------------------------------------------
describe("Tournament - getRelativeRank", () => {
  beforeEach(() => reseedRandom(SEED));

  it("liga simple: ranking final con context tr_ y metadata de tournament", () => {
    const ctx = newCtx();
    ctx.store.set('fr_SRC', blockedRanking('fr_SRC', 8));
    const t = Tournament.create({ id: 'LIG', season: SEASON }, ligaConfig(), ctx, new FootballProfile());
    teamsAssign(t, ctx);
    advanceCalendar(ctx.calendar);

    const rank = t.getRelativeRank();
    expect(rank.context).toBe('tr_LIG');
    expect(rank.metadata?.generatedBy).toBe('tournament');
    expect(rank.metadata?.season).toBe(SEASON);
    // 8 posiciones 1..8
    const positions = rank.getRankTable().map((r) => r.pos);
    expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("multi-fase: la última fase concatena varios rank groups y las pos NO se repiten (fix)", () => {
    const ctx = newCtx();
    ctx.store.set('fr_SRC', blockedRanking('fr_SRC', 4));
    const t = Tournament.create({ id: 'T5', season: SEASON }, multiPhaseConfig(), ctx, new FootballProfile());
    teamsAssign(t, ctx);
    advanceCalendar(ctx.calendar);

    const table = t.getRelativeRank().getRankTable();
    const positions = table.map((r) => r.pos);

    // 4 equipos, pos 1..4 GLOBAL, sin repetidos (esto es lo que fallaba antes del fix:
    // la última fase concatena [finalistas, perd_semi], cada uno con su pos relativo).
    expect(positions.length).toBe(4);
    expect(new Set(positions).size).toBe(4);
    expect([...positions].sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);

    // no hay teams duplicados
    const teamIds = table.map((r) => r.team.id);
    expect(new Set(teamIds).size).toBe(4);
  });

  it("es determinista: mismo ranking final con misma semilla", () => {
    const run = () => {
      reseedRandom(SEED);
      const ctx = newCtx();
      ctx.store.set('fr_SRC', blockedRanking('fr_SRC', 4));
      const t = Tournament.create({ id: 'T5', season: SEASON }, multiPhaseConfig(), ctx, new FootballProfile());
      teamsAssign(t, ctx);
      advanceCalendar(ctx.calendar);
      return t.getRelativeRank().getRankTable().map((r) => `${r.pos}:${r.team.id}`);
    };
    expect(run()).toEqual(run());
  });
});
