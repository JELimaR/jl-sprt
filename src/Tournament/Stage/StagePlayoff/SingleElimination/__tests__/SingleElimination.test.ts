import { describe, it, expect } from "vitest";
import SingleElmination from "../SingleElmination";
import { Team } from "../../../../.jl-sprt-core";

// -----------------------------------------------------------------------------
// Capa 4 — SingleElimination (statics deterministas del bracket)
// -----------------------------------------------------------------------------

function team(id: string): Team {
  return { id } as unknown as Team;
}

describe("SingleElimination - maxNumberRound", () => {
  it("es log2(N) para potencias de 2", () => {
    expect(SingleElmination.maxNumberRound(2)).toBe(1);
    expect(SingleElmination.maxNumberRound(4)).toBe(2);
    expect(SingleElmination.maxNumberRound(8)).toBe(3);
    expect(SingleElmination.maxNumberRound(16)).toBe(4);
  });

  it("cuenta solo los factores 2 cuando N no es potencia de 2", () => {
    // 12 = 2^2 * 3 -> 2 rondas posibles (12->6->3)
    expect(SingleElmination.maxNumberRound(12)).toBe(2);
    // 6 = 2 * 3 -> 1 ronda (6->3)
    expect(SingleElmination.maxNumberRound(6)).toBe(1);
    // impar -> 0 rondas
    expect(SingleElmination.maxNumberRound(5)).toBe(0);
  });
});

describe("SingleElimination - winnersInMaxNumberRound", () => {
  it("es 1 para potencias de 2 (queda un solo campeón)", () => {
    expect(SingleElmination.winnersInMaxNumberRound(8)).toBe(1);
    expect(SingleElmination.winnersInMaxNumberRound(16)).toBe(1);
  });

  it("es el factor impar restante cuando N no es potencia de 2", () => {
    expect(SingleElmination.winnersInMaxNumberRound(12)).toBe(3); // 12/4
    expect(SingleElmination.winnersInMaxNumberRound(6)).toBe(3);  // 6/2
  });
});

describe("SingleElimination - teamsSortForDraw (sembrado bracket)", () => {
  it("empareja mejor vs peor: [tN-1, t0, tN-2, t1, ...]", () => {
    // array ordenado de mejor (t0) a peor (t3)
    const arr = [team('t0'), team('t1'), team('t2'), team('t3')];
    const out = SingleElmination.teamsSortForDraw(arr);
    // series de a 2: (t3 vs t0), (t2 vs t1) -> mejor contra peor
    expect(out.map((t) => t.id)).toEqual(['t3', 't0', 't2', 't1']);
  });

  it("con 8 equipos: el 1er sembrado (t0) enfrenta al peor (t7)", () => {
    const arr = Array.from({ length: 8 }, (_, i) => team(`t${i}`));
    const out = SingleElmination.teamsSortForDraw(arr);
    // primer par: (t7 vs t0)
    expect(out[0].id).toBe('t7');
    expect(out[1].id).toBe('t0');
    // es permutación
    expect(out.map((t) => t.id).sort()).toEqual(arr.map((t) => t.id).sort());
  });

  it("lanza si la cantidad de equipos es impar", () => {
    const arr = [team('t0'), team('t1'), team('t2')];
    expect(() => SingleElmination.teamsSortForDraw(arr)).toThrow(/par/);
  });
});

// -----------------------------------------------------------------------------
// SingleElimination.getTable — posiciones de los perdedores por ronda
//
// Corre una eliminatoria completa (assign + AdvanceAll, determinista con
// reseedRandom) y verifica que getTable asigna posiciones coherentes:
//  - un único campeón (pos 1),
//  - los eliminados en rondas tempranas quedan por debajo de los que avanzan más.
// -----------------------------------------------------------------------------
import { JCalendar } from "jl-calendar";
import { FootballProfile, reseedRandom } from "jl-sprt-match";
import { AdvanceAll } from "../../../../Advance";
import { ISingleElminationConfig, IElementInfo } from "../../../../../JSportModule";
import { getExampleTeams } from "../../../../../examples/ExampleData";
import SingleElminationDefault from "../SingleElmination";

describe("SingleElimination.getTable - posiciones por ronda (end-to-end)", () => {
  function playoffConfig(): ISingleElminationConfig {
    return {
      idConfig: 'SE1',
      name: 'Single Elimination',
      opt: 'home',
      participantsNumber: 4,
      roundsNumber: 2,
      roundHalfWeeks: [[12, 12], [16, 16]] as any,
      roundHalfWeeksSchedule: [10, 14] as any,
    };
  }

  function runPlayoff() {
    reseedRandom(13);
    const cal = JCalendar.createFromYear(2000);
    const info: IElementInfo = { id: 'SE', season: 2000 };
    const se = new SingleElminationDefault(info, playoffConfig(), new FootballProfile());
    const teams = getExampleTeams(4, 'football', 'SE');
    se.assign(teams, cal);
    AdvanceAll(cal);
    return se;
  }

  it("la eliminatoria termina y produce una tabla con los 4 equipos", () => {
    const se = runPlayoff();
    expect(se.isFinished).toBe(true);
    const table = se.getTable('finished');
    expect(table.length).toBe(4);
  });

  it("hay un único campeón en la posición 1", () => {
    const se = runPlayoff();
    const table = se.getTable('finished');
    const pos1 = table.filter((t) => t.pos === 1);
    expect(pos1.length).toBe(1);
  });

  it("los eliminados en la primera ronda comparten la peor posición", () => {
    const se = runPlayoff();
    const table = se.getTable('finished');
    // 2 rondas: los perdedores de la ronda 1 (idx 0) reciben pos = rounds.length + 1 - 0 = 3.
    const worst = Math.max(...table.map((t) => t.pos));
    const atWorst = table.filter((t) => t.pos === worst);
    // en la ronda 1 se eliminan 2 equipos (4 -> 2)
    expect(atWorst.length).toBe(2);
    expect(worst).toBeGreaterThan(1);
  });
});
