import { describe, it, expect, beforeEach } from "vitest";
import StagePlayoff from "../StagePlayoff";
import { JCalendar, TypeHalfWeekOfYear } from "jl-calendar";
import { IElementInfo, IStagePlayoffConfig, IRankItem } from "../../../../JSportModule";
import { SimulationContext } from "../../../SimulationContext";
import { getExampleTeams } from "../../../../examples/ExampleData";
import { FootballProfile, reseedRandom } from "jl-sprt-match";
import { AnyTeam } from "jl-sprt-core";

// -----------------------------------------------------------------------------
// StagePlayoff — construcción, drawRulesValidate y sorteo/asignación.
// -----------------------------------------------------------------------------

const SEASON = 2000;
const SEED = 13;

function ctx() {
  return new SimulationContext(JCalendar.createFromYear(SEASON));
}

function info(id = 'SP'): IElementInfo {
  return { id, season: SEASON };
}

/** Playoff VÁLIDO: 4 participantes, 2 rondas (4->2->1), opt home. */
function baseConfig(): IStagePlayoffConfig {
  return {
    type: 'playoff',
    idConfig: 'sp1',
    name: 'Playoff Stage',
    hwStart: 10,
    hwEnd: 30,
    bombos: [4],
    qualifyConditions: [{ rankId: 'r', season: 'current', minRankPos: 1, maxRankPos: 4 }],
    bsConfig: {
      idConfig: 'sp1-P',
      name: 'Single Elimination',
      opt: 'home',
      participantsNumber: 4,
      roundsNumber: 2,
      roundHalfWeeks: [[12, 12], [16, 16]] as any,
      roundHalfWeeksSchedule: [10, 14] as TypeHalfWeekOfYear[],
    },
    drawRulesValidate: [],
  };
}

function rankItems(teams: AnyTeam[], origins?: string[]): IRankItem[] {
  return teams.map((team, i) => ({ origin: origins ? origins[i] : 'r', pos: i + 1, team }));
}

describe("StagePlayoff - construcción", () => {
  it("se construye sin lanzar con una config coherente y crea su SingleElimination", () => {
    const sp = new StagePlayoff(info(), baseConfig(), ctx(), new FootballProfile());
    expect(sp.playoff).toBeDefined();
  });

  it("lanza si roundsNumber excede el máximo para participantsNumber", () => {
    const c = baseConfig();
    c.bsConfig.roundsNumber = 3; // 4 participantes -> max 2 rondas
    expect(() => new StagePlayoff(info(), c, ctx(), new FootballProfile())).toThrow();
  });
});

describe("StagePlayoff - drawRulesValidate (empareja i vs N-1-i)", () => {
  it("sin reglas, cualquier orden es válido", () => {
    const sp = new StagePlayoff(info(), baseConfig(), ctx(), new FootballProfile());
    const teams = getExampleTeams(4, 'football', 'SP');
    expect(sp.drawRulesValidate(rankItems(teams))).toBe(true);
  });

  it("regla 'all': rechaza que una serie enfrente dos equipos del mismo origin", () => {
    const c = baseConfig();
    c.drawRulesValidate = [{ origin: 'all', minCount: 1 } as any];
    const sp = new StagePlayoff(info(), c, ctx(), new FootballProfile());
    const teams = getExampleTeams(4, 'football', 'SP');
    // Serie 0: teams[0] vs teams[3]; Serie 1: teams[1] vs teams[2].
    // Ponemos el mismo origin en 0 y 3 -> la serie 0 sería inválida.
    const items = rankItems(teams, ['X', 'A', 'B', 'X']);
    expect(sp.drawRulesValidate(items)).toBe(false);
  });
});

describe("StagePlayoff - asignación de equipos", () => {
  beforeEach(() => reseedRandom(SEED));

  it("sin sorteo: asigna los participantes al playoff", () => {
    const sp = new StagePlayoff(info(), baseConfig(), ctx(), new FootballProfile());
    const teams = getExampleTeams(4, 'football', 'SP');
    const cal = JCalendar.createFromYear(SEASON);
    sp.start(rankItems(teams), cal);
    expect(sp.playoff.teamsArr.length).toBe(4);
    const ids = sp.playoff.teamsArr.map((t) => t.id);
    expect(new Set(ids).size).toBe(4);
  });

  it("con sorteo (intervalOfDrawDate): asigna sin perder ni duplicar", () => {
    const c = baseConfig();
    c.intervalOfDrawDate = 40;
    const sp = new StagePlayoff(info(), c, ctx(), new FootballProfile());
    const teams = getExampleTeams(4, 'football', 'SP');
    const cal = JCalendar.createFromYear(SEASON);
    sp.start(rankItems(teams), cal);
    expect(new Set(sp.playoff.teamsArr.map((t) => t.id)).size).toBe(4);
  });
});
