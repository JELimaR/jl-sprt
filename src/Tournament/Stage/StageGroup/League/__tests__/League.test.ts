import { describe, it, expect } from "vitest";
import League from "../League";
import robinRoundSchedulingFunction from "../RoundRobin";
import Team from "../../../../../JSportModule/data/Team";
import { arr2 } from "../../../../../JSportModule";

// -----------------------------------------------------------------------------
// Capa 4 — League / Round Robin (lógica determinista de fixture)
//
// Se testea el CALENDARIO de round-robin (puro, sin simular partidos): cantidad de
// fechas y de partidos, que cada par se enfrente la cantidad correcta de veces, y el
// sembrado (teamsSortForDraw). Estos son los invariantes estructurales del fixture.
// -----------------------------------------------------------------------------

/** Cuenta cuántas veces se enfrenta cada par (sin importar localía) en un fixture. */
function pairCounts(sch: arr2<number>[][]): Map<string, number> {
  const counts = new Map<string, number>();
  sch.forEach((round) => {
    round.forEach((m) => {
      const a = m[0], b = m[1];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
  });
  return counts;
}

function totalMatches(sch: arr2<number>[][]): number {
  return sch.reduce((sum, round) => sum + round.length, 0);
}

describe("Round Robin - cantidad de partidos", () => {
  it("opt 'home' (una vuelta): N(N-1)/2 partidos, cada par 1 vez", () => {
    for (const n of [2, 3, 4, 6, 8]) {
      const sch = robinRoundSchedulingFunction(n, 'home');
      expect(totalMatches(sch)).toBe((n * (n - 1)) / 2);
      const counts = pairCounts(sch);
      expect(counts.size).toBe((n * (n - 1)) / 2);
      for (const c of counts.values()) expect(c).toBe(1);
    }
  });

  it("opt 'h&a' (ida y vuelta): N(N-1) partidos, cada par 2 veces", () => {
    for (const n of [2, 4, 6, 8]) {
      const sch = robinRoundSchedulingFunction(n, 'h&a');
      expect(totalMatches(sch)).toBe(n * (n - 1));
      const counts = pairCounts(sch);
      expect(counts.size).toBe((n * (n - 1)) / 2);
      for (const c of counts.values()) expect(c).toBe(2);
    }
  });

  it("h&a: cada par se enfrenta una vez de local y una de visitante", () => {
    const n = 4;
    const sch = robinRoundSchedulingFunction(n, 'h&a');
    // para cada par ordenado (a,b), (a local) y (b local) deben aparecer una vez cada uno
    const homeCounts = new Map<string, number>();
    sch.forEach((round) => round.forEach((m) => {
      const home = m[0], away = m[1];
      homeCounts.set(`${home}>${away}`, (homeCounts.get(`${home}>${away}`) ?? 0) + 1);
    }));
    for (let a = 1; a <= n; a++) {
      for (let b = 1; b <= n; b++) {
        if (a === b) continue;
        expect(homeCounts.get(`${a}>${b}`) ?? 0).toBe(1);
      }
    }
  });

  it("lanza para N fuera del rango [2,20]", () => {
    expect(() => robinRoundSchedulingFunction(1, 'home')).toThrow();
    expect(() => robinRoundSchedulingFunction(21, 'home')).toThrow();
  });
});

// -----------------------------------------------------------------------------
// Statics de League
// -----------------------------------------------------------------------------
describe("League - statics", () => {
  it("getTurnsNumber: N-1 fechas (par) para h&a duplicado", () => {
    // home: N par -> N-1 fechas; h&a duplica las fechas
    expect(League.getTurnsNumber(4, 'home')).toBe(3);
    expect(League.getTurnsNumber(4, 'h&a')).toBe(6);
    expect(League.getTurnsNumber(8, 'home')).toBe(7);
    expect(League.getTurnsNumber(8, 'h&a')).toBe(14);
  });

  it("getCantMatches coincide con el total del fixture", () => {
    for (const n of [4, 6, 8]) {
      expect(League.getCantMatches(n, 'home')).toBe((n * (n - 1)) / 2);
      expect(League.getCantMatches(n, 'h&a')).toBe(n * (n - 1));
    }
  });
});

// -----------------------------------------------------------------------------
// teamsSortForDraw — sembrado
// -----------------------------------------------------------------------------
describe("League - teamsSortForDraw", () => {
  function team(id: string): Team {
    return { id } as unknown as Team;
  }

  it("reordena preservando todos los equipos (permutación)", () => {
    const arr = Array.from({ length: 8 }, (_, i) => team(`t${i}`));
    const out = League.teamsSortForDraw(arr);
    expect(out.length).toBe(arr.length);
    // misma composición de equipos (permutación, sin perder ni duplicar)
    expect(out.map((t) => t.id).sort()).toEqual(arr.map((t) => t.id).sort());
  });
});
