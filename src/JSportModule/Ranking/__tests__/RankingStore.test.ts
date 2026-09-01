import { describe, it, expect } from "vitest";
import { RankingStore } from "../RankingStore";
import { Ranking } from "../Ranking";
import { IRankItem, IRankingMetadata } from "../interfaces";
import Team from "../../data/Team";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function fakeTeam(id: string): Team {
  return { id } as unknown as Team;
}

/** Crea un ranking bloqueado (poblado) mínimo, listo para guardar en el store. */
function blockedRanking(context: string, teamId: string, metadata?: IRankingMetadata): Ranking {
  const arr: IRankItem[] = [{ origin: context, pos: 1, team: fakeTeam(teamId), score: 1 }];
  return Ranking.fromRankItemArr(context, arr, metadata);
}

/** Crea un ranking NO bloqueado (con items pero sin teams). */
function unblockedRanking(context: string): Ranking {
  return Ranking.fromTypeRanking({
    context,
    items: [{ origin: context, pos: 1 }],
    teams: [],
  });
}

// -----------------------------------------------------------------------------
// set / get
// -----------------------------------------------------------------------------
describe("RankingStore - set / get", () => {
  it("guarda y recupera el ranking por context", () => {
    const store = new RankingStore();
    const r = blockedRanking("ctx", "A");
    store.set("ctx", r);
    expect(store.get("ctx")).toBe(r);
  });

  it("get devuelve undefined si el context no existe", () => {
    const store = new RankingStore();
    expect(store.get("nope")).toBeUndefined();
  });

  it("set dos veces mismo context: get devuelve el último, getHistory devuelve ambos", () => {
    const store = new RankingStore();
    const r1 = blockedRanking("ctx", "A");
    const r2 = blockedRanking("ctx", "B");
    store.set("ctx", r1);
    store.set("ctx", r2);
    expect(store.get("ctx")).toBe(r2);
    expect(store.getHistory("ctx")).toEqual([r1, r2]);
  });

  it("lanza si se intenta guardar un ranking NO bloqueado", () => {
    const store = new RankingStore();
    expect(() => store.set("ctx", unblockedRanking("ctx"))).toThrow(/no esta bloqueado/);
  });
});

// -----------------------------------------------------------------------------
// getHistory
// -----------------------------------------------------------------------------
describe("RankingStore - getHistory", () => {
  it("devuelve [] si no hay historial para el context", () => {
    const store = new RankingStore();
    expect(store.getHistory("nope")).toEqual([]);
  });

  it("acumula en orden de inserción", () => {
    const store = new RankingStore();
    const r1 = blockedRanking("c", "A", { season: 1 });
    const r2 = blockedRanking("c", "B", { season: 2 });
    const r3 = blockedRanking("c", "C", { season: 3 });
    store.set("c", r1);
    store.set("c", r2);
    store.set("c", r3);
    expect(store.getHistory("c")).toEqual([r1, r2, r3]);
  });
});

// -----------------------------------------------------------------------------
// getBySeason (invariante: uno por (context, season))
// -----------------------------------------------------------------------------
describe("RankingStore - getBySeason", () => {
  it("encuentra el ranking por metadata.season dentro del context", () => {
    const store = new RankingStore();
    const r1 = blockedRanking("c", "A", { season: 2020 });
    const r2 = blockedRanking("c", "B", { season: 2021 });
    store.set("c", r1);
    store.set("c", r2);
    expect(store.getBySeason("c", 2020)).toBe(r1);
    expect(store.getBySeason("c", 2021)).toBe(r2);
  });

  it("devuelve undefined si no existe esa season", () => {
    const store = new RankingStore();
    store.set("c", blockedRanking("c", "A", { season: 2020 }));
    expect(store.getBySeason("c", 1999)).toBeUndefined();
  });

  it("devuelve undefined si el context no existe", () => {
    const store = new RankingStore();
    expect(store.getBySeason("nope", 2020)).toBeUndefined();
  });

  it("no encuentra por season si el ranking no tiene metadata", () => {
    const store = new RankingStore();
    store.set("c", blockedRanking("c", "A")); // sin metadata
    expect(store.getBySeason("c", 2020)).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// has / keys / size / forEach / clear
// -----------------------------------------------------------------------------
describe("RankingStore - has / keys / size / forEach / clear", () => {
  it("has refleja la presencia del context", () => {
    const store = new RankingStore();
    expect(store.has("c")).toBe(false);
    store.set("c", blockedRanking("c", "A"));
    expect(store.has("c")).toBe(true);
  });

  it("keys devuelve los contexts current", () => {
    const store = new RankingStore();
    store.set("a", blockedRanking("a", "A"));
    store.set("b", blockedRanking("b", "B"));
    expect([...store.keys()].sort()).toEqual(["a", "b"]);
  });

  it("size cuenta contexts únicos (no entradas de historial)", () => {
    const store = new RankingStore();
    store.set("c", blockedRanking("c", "A"));
    store.set("c", blockedRanking("c", "B")); // mismo context
    store.set("d", blockedRanking("d", "C"));
    expect(store.size).toBe(2);
  });

  it("forEach itera sobre los rankings current", () => {
    const store = new RankingStore();
    store.set("a", blockedRanking("a", "A"));
    store.set("b", blockedRanking("b", "B"));
    const seen: string[] = [];
    store.forEach((_value, key) => seen.push(key));
    expect(seen.sort()).toEqual(["a", "b"]);
  });

  it("clear vacía current e historial", () => {
    const store = new RankingStore();
    store.set("c", blockedRanking("c", "A"));
    store.clear();
    expect(store.size).toBe(0);
    expect(store.has("c")).toBe(false);
    expect(store.getHistory("c")).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// Aislamiento entre instancias (regresión del refactor del global)
// -----------------------------------------------------------------------------
describe("RankingStore - aislamiento entre instancias", () => {
  it("dos stores no comparten estado", () => {
    const s1 = new RankingStore();
    const s2 = new RankingStore();
    s1.set("c", blockedRanking("c", "A"));
    expect(s1.has("c")).toBe(true);
    expect(s2.has("c")).toBe(false);
    expect(s2.size).toBe(0);
  });
});
