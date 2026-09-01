import { describe, it, expect } from "vitest";
import { Ranking, TypeRanking } from "../Ranking";
import { RankingStore } from "../RankingStore";
import { IGenericRankItem, IRankItem, IRankingMetadata } from "../interfaces";
import Team from "../../data/Team";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
// Ranking es agnóstico al dominio: solo usa `team.id` y guarda la referencia al
// team. Construir un Team real requiere Institution/Federation, así que usamos
// fakes livianos casteados a Team (patrón acordado en Q.md).
function fakeTeam(id: string): Team {
  return { id } as unknown as Team;
}

function item(origin: string, pos: number): IGenericRankItem {
  return { origin, pos };
}

function rankItem(origin: string, pos: number, teamId: string, score?: number): IRankItem {
  return { origin, pos, team: fakeTeam(teamId), score };
}

// -----------------------------------------------------------------------------
// Construcción y validación
// -----------------------------------------------------------------------------
describe("Ranking - construcción y validación", () => {
  it("fromTypeRanking construye con items y teams alineados", () => {
    const tr: TypeRanking = {
      context: "ctx",
      items: [item("o", 1), item("o", 2)],
      teams: [fakeTeam("A"), fakeTeam("B")],
    };
    const r = Ranking.fromTypeRanking(tr);
    expect(r.context).toBe("ctx");
    expect(r.size).toBe(2);
  });

  it("lanza si items.length !== teams.length (con teams no vacío)", () => {
    const tr: TypeRanking = {
      context: "ctx",
      items: [item("o", 1), item("o", 2)],
      teams: [fakeTeam("A")],
    };
    expect(() => Ranking.fromTypeRanking(tr)).toThrow();
  });

  it("fromQualyCondition genera items según min/max pos, sin teams (no bloqueado)", () => {
    const r = Ranking.fromQualyCondition({
      rankId: "q",
      season: "current",
      minRankPos: 3,
      maxRankPos: 6,
    });
    expect(r.size).toBe(4); // 3,4,5,6
    expect(r.isBlocked).toBe(false);
    expect(r.getGenericRankItems().map((i) => i.pos)).toEqual([3, 4, 5, 6]);
    expect(r.getGenericRankItems().every((i) => i.origin === "q")).toBe(true);
  });

  it("fromRankItemArr genera items + teams + scores + metadata", () => {
    const arr: IRankItem[] = [
      rankItem("o", 1, "A", 10),
      rankItem("o", 2, "B", 8),
    ];
    const meta: IRankingMetadata = { season: 2020, generatedBy: "stage" };
    const r = Ranking.fromRankItemArr("ctx", arr, meta);
    expect(r.isBlocked).toBe(true);
    expect(r.metadata).toEqual(meta);
    const table = r.getRankTable();
    expect(table.map((t) => t.team.id)).toEqual(["A", "B"]);
    expect(table.map((t) => t.score)).toEqual([10, 8]);
  });

  it("un ranking con teams vacío es válido (no poblado / no bloqueado)", () => {
    const r = Ranking.fromTypeRanking({
      context: "ctx",
      items: [item("o", 1), item("o", 2)],
      teams: [],
    });
    expect(r.isBlocked).toBe(false);
    expect(r.getRankTable()).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// isBlocked
// -----------------------------------------------------------------------------
describe("Ranking - isBlocked", () => {
  it("true cuando items y teams coinciden en cantidad", () => {
    const r = Ranking.fromTypeRanking({
      context: "c",
      items: [item("o", 1)],
      teams: [fakeTeam("A")],
    });
    expect(r.isBlocked).toBe(true);
  });

  it("false cuando teams está vacío y hay items", () => {
    const r = Ranking.fromTypeRanking({
      context: "c",
      items: [item("o", 1)],
      teams: [],
    });
    expect(r.isBlocked).toBe(false);
  });

  it("addTeams poblando la cantidad correcta pasa a bloqueado", () => {
    const r = Ranking.fromTypeRanking({
      context: "c",
      items: [item("o", 1), item("o", 2)],
      teams: [],
    });
    expect(r.isBlocked).toBe(false);
    r.addTeams([fakeTeam("A"), fakeTeam("B")]);
    expect(r.isBlocked).toBe(true);
    expect(r.getRankTable().map((t) => t.team.id)).toEqual(["A", "B"]);
  });

  it("addTeams lanza si la cantidad no coincide", () => {
    const r = Ranking.fromTypeRanking({
      context: "c",
      items: [item("o", 1), item("o", 2)],
      teams: [],
    });
    expect(() => r.addTeams([fakeTeam("A")])).toThrow();
  });
});

// -----------------------------------------------------------------------------
// getRankTable
// -----------------------------------------------------------------------------
describe("Ranking - getRankTable", () => {
  it("vacío si no está bloqueado", () => {
    const r = Ranking.fromTypeRanking({
      context: "c",
      items: [item("o", 1)],
      teams: [],
    });
    expect(r.getRankTable()).toEqual([]);
  });

  it("incluye score cuando corresponde", () => {
    const r = Ranking.fromRankItemArr("c", [
      rankItem("o", 1, "A", 5),
      rankItem("o", 2, "B", 3),
    ]);
    const table = r.getRankTable();
    expect(table).toHaveLength(2);
    expect(table[0]).toMatchObject({ origin: "o", pos: 1, score: 5 });
    expect(table[0].team.id).toBe("A");
  });
});

// -----------------------------------------------------------------------------
// getFromPosition (dos errores distintos)
// -----------------------------------------------------------------------------
describe("Ranking - getFromPosition", () => {
  it("devuelve el team/score de la posición pedida", () => {
    const r = Ranking.fromRankItemArr("c", [
      rankItem("o", 1, "A", 5),
      rankItem("o", 2, "B", 3),
    ]);
    const ri = r.getFromPosition(2);
    expect(ri.team.id).toBe("B");
    expect(ri.score).toBe(3);
  });

  it("lanza error de 'no bloqueado' si el ranking no está poblado", () => {
    const r = Ranking.fromTypeRanking({
      context: "c",
      items: [item("o", 1)],
      teams: [],
    });
    expect(() => r.getFromPosition(1)).toThrow(/no esta bloqueado/);
  });

  it("lanza error de 'posición inexistente' si la pos no existe", () => {
    const r = Ranking.fromRankItemArr("c", [rankItem("o", 1, "A", 5)]);
    expect(() => r.getFromPosition(99)).toThrow(/no cuenta con la posicion/);
  });
});

// -----------------------------------------------------------------------------
// getInterface / copy (inmutabilidad)
// -----------------------------------------------------------------------------
describe("Ranking - getInterface / copy", () => {
  it("getInterface preserva context, items, teams, scores y metadata", () => {
    const meta: IRankingMetadata = { season: 2021, generatedBy: "tournament" };
    const r = Ranking.fromRankItemArr(
      "c",
      [rankItem("o", 1, "A", 5), rankItem("o", 2, "B", 3)],
      meta
    );
    const iface = r.getInterface();
    expect(iface.context).toBe("c");
    expect(iface.items).toHaveLength(2);
    expect(iface.teams!.map((t) => t.id)).toEqual(["A", "B"]);
    expect(iface.scores).toEqual([5, 3]);
    expect(iface.metadata).toEqual(meta);
  });

  it("getInterface devuelve copias de arrays (mutar la copia no afecta al original)", () => {
    const r = Ranking.fromRankItemArr("c", [rankItem("o", 1, "A", 5)]);
    const iface = r.getInterface();
    iface.items.push(item("o", 2));
    expect(r.size).toBe(1); // el original no cambió
  });

  it("getInterface devuelve una copia de metadata (no la misma referencia)", () => {
    const meta: IRankingMetadata = { season: 2021 };
    const r = Ranking.fromRankItemArr("c", [rankItem("o", 1, "A", 5)], meta);
    const iface = r.getInterface();
    expect(iface.metadata).toEqual(meta);
    expect(iface.metadata).not.toBe(meta);
  });

  it("copy produce un ranking equivalente e independiente", () => {
    const meta: IRankingMetadata = { season: 2021 };
    const r = Ranking.fromRankItemArr(
      "c",
      [rankItem("o", 1, "A", 5), rankItem("o", 2, "B", 3)],
      meta
    );
    const c = r.copy();
    expect(c.context).toBe(r.context);
    expect(c.size).toBe(r.size);
    expect(c.getRankTable().map((t) => t.team.id)).toEqual(["A", "B"]);
    expect(c.metadata).toEqual(meta);
  });
});

// -----------------------------------------------------------------------------
// metadata
// -----------------------------------------------------------------------------
describe("Ranking - metadata", () => {
  it("se almacena y expone", () => {
    const meta: IRankingMetadata = {
      season: 2022,
      generatedBy: "federation",
      rankedEntity: "institution",
      sourceId: "F_025",
    };
    const r = Ranking.fromRankItemArr("c", [rankItem("o", 1, "A")], meta);
    expect(r.metadata).toEqual(meta);
  });

  it("es undefined si no se provee", () => {
    const r = Ranking.fromRankItemArr("c", [rankItem("o", 1, "A")]);
    expect(r.metadata).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// combine
// -----------------------------------------------------------------------------
describe("Ranking - combine", () => {
  it("suma ponderada de scores por team y ordena descendente", () => {
    const r1 = Ranking.fromRankItemArr("r1", [
      rankItem("r1", 1, "A", 10),
      rankItem("r1", 2, "B", 4),
    ]);
    const r2 = Ranking.fromRankItemArr("r2", [
      rankItem("r2", 1, "B", 10),
      rankItem("r2", 2, "A", 2),
    ]);
    // A: 10*1 + 2*0.5 = 11 ; B: 4*1 + 10*0.5 = 9
    const combined = Ranking.combine("comb", [
      { ranking: r1, weight: 1 },
      { ranking: r2, weight: 0.5 },
    ]);
    const table = combined.getRankTable();
    expect(table.map((t) => t.team.id)).toEqual(["A", "B"]);
    expect(table.map((t) => t.score)).toEqual([11, 9]);
    expect(table.map((t) => t.pos)).toEqual([1, 2]);
  });

  it("teams sin score se tratan como 0", () => {
    const r1 = Ranking.fromRankItemArr("r1", [rankItem("r1", 1, "A")]); // score undefined
    const combined = Ranking.combine("comb", [{ ranking: r1, weight: 1 }]);
    expect(combined.getRankTable()[0].score).toBe(0);
  });

  it("un team presente en varios sources se acumula una sola vez (fila única)", () => {
    const r1 = Ranking.fromRankItemArr("r1", [rankItem("r1", 1, "A", 3)]);
    const r2 = Ranking.fromRankItemArr("r2", [rankItem("r2", 1, "A", 4)]);
    const combined = Ranking.combine("comb", [
      { ranking: r1, weight: 1 },
      { ranking: r2, weight: 1 },
    ]);
    const table = combined.getRankTable();
    expect(table).toHaveLength(1);
    expect(table[0].score).toBe(7);
  });

  it("ante empate de score desempata de forma estable por team.id", () => {
    const r1 = Ranking.fromRankItemArr("r1", [
      rankItem("r1", 1, "Z", 5),
      rankItem("r1", 2, "A", 5),
    ]);
    const combined = Ranking.combine("comb", [{ ranking: r1, weight: 1 }]);
    // ambos con score 5 -> orden por id: A antes que Z
    expect(combined.getRankTable().map((t) => t.team.id)).toEqual(["A", "Z"]);
  });
});

// -----------------------------------------------------------------------------
// historical
// -----------------------------------------------------------------------------
describe("Ranking - historical", () => {
  it("toma rankings por season del store y aplica pesos", () => {
    const store = new RankingStore();
    store.set(
      "base",
      Ranking.fromRankItemArr("base", [rankItem("base", 1, "A", 10)], { season: 1 })
    );
    store.set(
      "base",
      Ranking.fromRankItemArr("base", [rankItem("base", 1, "A", 20)], { season: 2 })
    );

    // season1 * 1 + season2 * 0.5 = 10 + 10 = 20
    const hist = Ranking.historical("hist", store, "base", [1, 2], [1, 0.5]);
    expect(hist.getRankTable()[0].team.id).toBe("A");
    expect(hist.getRankTable()[0].score).toBe(20);
  });

  it("devuelve ranking vacío si no hay sources", () => {
    const store = new RankingStore();
    const hist = Ranking.historical("hist", store, "base", [1, 2]);
    expect(hist.size).toBe(0);
    expect(hist.getRankTable()).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// aggregate
// -----------------------------------------------------------------------------
describe("Ranking - aggregate", () => {
  it("recopila teams únicos, aplica scoreFn y ordena descendente", () => {
    const r1 = Ranking.fromRankItemArr("r1", [
      rankItem("r1", 1, "A", 3),
      rankItem("r1", 2, "B", 1),
    ]);
    const r2 = Ranking.fromRankItemArr("r2", [rankItem("r2", 1, "A", 5)]);

    // scoreFn: suma de scores del team en todos los rankings
    const scoreFn = (team: Team, rankings: Ranking[]) =>
      rankings.reduce((acc, rk) => {
        const found = rk.getRankTable().find((ri) => ri.team.id === team.id);
        return acc + (found?.score ?? 0);
      }, 0);

    const agg = Ranking.aggregate("agg", [r1, r2], scoreFn);
    const table = agg.getRankTable();
    // A: 3+5=8 ; B: 1
    expect(table.map((t) => t.team.id)).toEqual(["A", "B"]);
    expect(table.map((t) => t.score)).toEqual([8, 1]);
    expect(table.map((t) => t.pos)).toEqual([1, 2]);
  });

  it("ante empate desempata de forma estable por team.id", () => {
    const r1 = Ranking.fromRankItemArr("r1", [
      rankItem("r1", 1, "Z", 1),
      rankItem("r1", 2, "A", 1),
    ]);
    const agg = Ranking.aggregate("agg", [r1], () => 1);
    expect(agg.getRankTable().map((t) => t.team.id)).toEqual(["A", "Z"]);
  });
});
