import { describe, it, expect } from "vitest";
import SingleElmination from "../SingleElmination";
import Team from "../../../../../JSportModule/data/Team";

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
