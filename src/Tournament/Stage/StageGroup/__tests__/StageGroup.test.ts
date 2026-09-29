import { describe, it, expect, beforeEach } from "vitest";
import StageGroup from "../StageGroup";
import { JCalendar } from "jl-calendar";
import { IElementInfo, IStageGroupConfig } from "../../../../JSportModule";
import { SimulationContext } from "../../../SimulationContext";
import { getExampleTeams } from "../../../../examples/ExampleData";
import { FootballProfile, reseedRandom } from "jl-sprt-match";
import { IRankItem } from "../../../../JSportModule";
import { AnyTeam } from "jl-sprt-core";

// -----------------------------------------------------------------------------
// StageGroup — validaciones de construcción (Stage + propias) y reparto de equipos.
//
// Cubre lo que hoy no tenía test unitario propio: las validaciones fuertes del
// constructor de Stage/StageGroup y el reparto serpentina (teamsNoDraw) vs sorteo
// determinista (teamsDraw con reseedRandom).
// -----------------------------------------------------------------------------

const SEASON = 2000;
const SEED = 13;

function ctx() {
  return new SimulationContext(JCalendar.createFromYear(SEASON));
}

function info(id = 'SG'): IElementInfo {
  return { id, season: SEASON };
}

/**
 * Config base VÁLIDA: 2 grupos de 3 (opt home => 3 turnos por grupo), bombos que
 * suman 6, qualifyConditions que también suman 6, fechas coherentes en rango.
 */
function baseConfig(): IStageGroupConfig {
  return {
    type: 'group',
    idConfig: 'sg1',
    name: 'Group Stage',
    hwStart: 10,
    hwEnd: 30,
    bombos: [2, 2, 2],
    qualifyConditions: [{ rankId: 'r', season: 'current', minRankPos: 1, maxRankPos: 6 }],
    participantsPerGroup: [3, 3],
    bsConfig: {
      idConfig: 'sg1-G',
      name: 'Group',
      opt: 'home',
      participantsNumber: 3,
      turnHalfWeeks: [12, 14, 16],
      turnHalfWeeksSchedule: [10, 10, 10],
    },
    drawRulesValidate: [],
  };
}

function rankItems(teams: AnyTeam[], origin = 'r'): IRankItem[] {
  return teams.map((team, i) => ({ origin, pos: i + 1, team }));
}

describe("StageGroup - construcción válida", () => {
  it("se construye sin lanzar con una config coherente", () => {
    expect(() => new StageGroup(info(), baseConfig(), ctx(), new FootballProfile())).not.toThrow();
  });

  it("crea un grupo (League) por cada participantsPerGroup", () => {
    const sg = new StageGroup(info(), baseConfig(), ctx(), new FootballProfile());
    expect(sg.groups.length).toBe(2);
    expect(sg.groupsNumber).toBe(2);
  });
});

describe("StageGroup - validaciones del constructor (Stage)", () => {
  it("lanza si hwStart > hwEnd", () => {
    const c = baseConfig();
    c.hwStart = 40; // > hwEnd
    expect(() => new StageGroup(info(), c, ctx(), new FootballProfile())).toThrow();
  });

  it("lanza si una fecha de match cae fuera del rango [hwStart, hwEnd]", () => {
    const c = baseConfig();
    c.bsConfig.turnHalfWeeks = [12, 14, 99]; // 99 > hwEnd
    expect(() => new StageGroup(info(), c, ctx(), new FootballProfile())).toThrow();
  });

  it("lanza si hay fechas de match repetidas", () => {
    const c = baseConfig();
    c.bsConfig.turnHalfWeeks = [12, 12, 16]; // repetida
    expect(() => new StageGroup(info(), c, ctx(), new FootballProfile())).toThrow();
  });

  it("lanza si la suma de qualifyConditions no coincide con la suma de bombos", () => {
    const c = baseConfig();
    c.qualifyConditions = [{ rankId: 'r', season: 'current', minRankPos: 1, maxRankPos: 5 }]; // suma 5 != 6
    expect(() => new StageGroup(info(), c, ctx(), new FootballProfile())).toThrow();
  });

  it("lanza si un match se agenda antes de su schedule", () => {
    const c = baseConfig();
    c.bsConfig.turnHalfWeeksSchedule = [20, 10, 10]; // schedule[0]=20 > match[0]=12
    expect(() => new StageGroup(info(), c, ctx(), new FootballProfile())).toThrow();
  });
});

describe("StageGroup - validación propia (bombos vs participantsPerGroup)", () => {
  it("lanza si los bombos no suman los participantes de los grupos", () => {
    const c = baseConfig();
    c.participantsPerGroup = [3, 4]; // suma 7, bombos suman 6
    // ajustar qualify para que no falle antes por la validación de Stage
    c.qualifyConditions = [{ rankId: 'r', season: 'current', minRankPos: 1, maxRankPos: 6 }];
    expect(() => new StageGroup(info(), c, ctx(), new FootballProfile())).toThrow();
  });
});

describe("StageGroup - reparto de equipos", () => {
  beforeEach(() => reseedRandom(SEED));

  it("teamsNoDraw (sin intervalOfDrawDate): reparte todos los equipos sin perder ni duplicar", () => {
    const c = baseConfig(); // sin intervalOfDrawDate -> serpentina determinista
    const sg = new StageGroup(info(), c, ctx(), new FootballProfile());
    const teams = getExampleTeams(6, 'football', 'SG');
    const cal = JCalendar.createFromYear(SEASON);

    sg.start(rankItems(teams), cal);

    // cada grupo recibió su cantidad, y el total no perdió ni duplicó equipos
    const assigned = sg.groups.flatMap((g) => g.teamsArr.map((t) => t.id));
    expect(assigned.length).toBe(6);
    expect(new Set(assigned).size).toBe(6);
    sg.groups.forEach((g) => expect(g.teamsArr.length).toBe(3));
  });

  it("teamsDraw (con intervalOfDrawDate): reparte con sorteo y sigue sin perder ni duplicar", () => {
    const c = baseConfig();
    c.intervalOfDrawDate = 40; // activa el sorteo con Bombo
    const sg = new StageGroup(info(), c, ctx(), new FootballProfile());
    const teams = getExampleTeams(6, 'football', 'SG');
    const cal = JCalendar.createFromYear(SEASON);

    sg.start(rankItems(teams), cal);

    const assigned = sg.groups.flatMap((g) => g.teamsArr.map((t) => t.id));
    expect(assigned.length).toBe(6);
    expect(new Set(assigned).size).toBe(6);
  });
});
