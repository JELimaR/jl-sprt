import { describe, it, expect } from "vitest";
import { InitialNode, FinalNode, RankGroupNode } from "../nodes";
import { StageGroupNode, StagePlayoffNode, calculateParticipantsPerGroupArray } from "../RealStageNode";
import { TableStageNode, TransferStageNode, ReOrderStageNode } from "../NoneStageNode";
import { Ranking } from "../../Ranking";

// =============================================================================
// Capa 2 — Nodos del GeneralStageGraph (GSG)
//
// POR QUÉ EXISTE ESTE GRAFO
// -------------------------
// Un torneo se modela como un grafo dirigido donde el "flujo" que circula por
// las aristas son EQUIPOS (más precisamente, posiciones de un ranking). Cada
// nodo representa una etapa (grupos, playoff) o un paso de procesamiento
// (transferir, dividir una tabla, reordenar). El grafo permite:
//   1) validar que un torneo es coherente ANTES de jugarlo, y
//   2) (objetivo del frontend) construir torneos de forma visual y validar en
//      tiempo real cada operación (agregar un nodo, conectar una arista, etc.).
//
// Cada nodo hace sus validaciones en el CONSTRUCTOR: si el nodo se puede
// construir sin lanzar, está "bien definido". Estos tests fijan esas reglas y
// documentan el porqué de cada una, para que el frontend pueda replicarlas.
// =============================================================================

// Un ranking de entrada de N posiciones (sin teams: en el GSG los nodos razonan
// sobre posiciones/estructura, no sobre equipos concretos todavía).
function rankingOfSize(context: string, n: number): Ranking {
  return Ranking.fromQualyCondition({ rankId: context, season: 'current', minRankPos: 1, maxRankPos: n });
}

// -----------------------------------------------------------------------------
// InitialNode — el punto de entrada del torneo
// -----------------------------------------------------------------------------
describe("InitialNode", () => {
  // POR QUÉ: el InitialNode declara CUÁNTOS clasificados entran (qualyRankList) y
  // cómo se reparten en grupos iniciales (rankGroups). Ambos deben cuadrar: no
  // se puede repartir en grupos una cantidad distinta de la que entra al torneo.
  it("valida que la suma de rankGroups sea igual a la cantidad de clasificados", () => {
    expect(() => new InitialNode({
      id: 'ini', tournamentId: 'T', nodeLvl: 0,
      qualyRankList: [
        { origin: 'fr', pos: 1 }, { origin: 'fr', pos: 2 },
        { origin: 'fr', pos: 3 }, { origin: 'fr', pos: 4 },
      ],
      rankGroups: [2, 2], // 2+2 = 4 = cantidad de clasificados -> OK
    })).not.toThrow();
  });

  it("lanza si rankGroups no cubre exactamente a los clasificados", () => {
    expect(() => new InitialNode({
      id: 'ini', tournamentId: 'T', nodeLvl: 0,
      qualyRankList: [{ origin: 'fr', pos: 1 }, { origin: 'fr', pos: 2 }, { origin: 'fr', pos: 3 }],
      rankGroups: [2, 2], // 4 != 3 -> lanza
    })).toThrow();
  });

  // getRanksGroups() reparte las posiciones en rankings consecutivos según
  // rankGroups. Con [2,2] y 4 clasificados -> dos rankings: pos [1,2] y [3,4].
  it("getRanksGroups reparte las posiciones en grupos consecutivos", () => {
    const node = new InitialNode({
      id: 'ini', tournamentId: 'T', nodeLvl: 0,
      qualyRankList: [
        { origin: 'fr', pos: 1 }, { origin: 'fr', pos: 2 },
        { origin: 'fr', pos: 3 }, { origin: 'fr', pos: 4 },
      ],
      rankGroups: [2, 2],
    });
    const groups = node.getRanksGroups();
    expect(groups).toHaveLength(2);
    expect(groups[0].size).toBe(2);
    expect(groups[1].size).toBe(2);
  });
});

// -----------------------------------------------------------------------------
// FinalNode — el punto de salida del torneo
// -----------------------------------------------------------------------------
describe("FinalNode", () => {
  // El FinalNode no produce rankings propios (solo recibe los finales), por eso
  // getRanksGroups() es vacío.
  it("no produce rankings propios", () => {
    const fin = new FinalNode({ id: 'fin', nodeLvl: 0 });
    expect(fin.getRanksGroups()).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// StagePlayoffNode — eliminación directa (playoff)
// -----------------------------------------------------------------------------
describe("StagePlayoffNode", () => {
  // POR QUÉ la regla de divisibilidad: un playoff de `roundsNumber` rondas
  // reduce los participantes a la mitad en cada ronda. Para que el bracket
  // "cierre" bien, la cantidad de participantes debe ser divisible por
  // 2^roundsNumber (NO necesariamente una potencia de 2: 6 participantes con 1
  // ronda es válido -> 6/2 = 3 series).
  it("acepta participantes divisibles por 2^roundsNumber", () => {
    expect(() => new StagePlayoffNode({
      id: 'ply', nodeLvl: 0, participants: 8, roundsNumber: 3, opt: 'h&a',
    })).not.toThrow(); // 8 / 2^3 = 1 entero
    expect(() => new StagePlayoffNode({
      id: 'ply', nodeLvl: 0, participants: 6, roundsNumber: 1, opt: 'home',
    })).not.toThrow(); // 6 / 2^1 = 3 entero
  });

  it("lanza si participantes NO es divisible por 2^roundsNumber", () => {
    expect(() => new StagePlayoffNode({
      id: 'ply', nodeLvl: 0, participants: 6, roundsNumber: 3, opt: 'h&a',
    })).toThrow(); // 6 / 8 no es entero
  });

  // getHwsNumber: cada ronda ocupa 1 half-week; si es ida y vuelta ('h&a'), 2.
  it("getHwsNumber = rondas (x2 si es ida y vuelta)", () => {
    expect(new StagePlayoffNode({ id: 'p', nodeLvl: 0, participants: 8, roundsNumber: 3, opt: 'home' }).getHwsNumber()).toBe(3);
    expect(new StagePlayoffNode({ id: 'p', nodeLvl: 0, participants: 8, roundsNumber: 3, opt: 'h&a' }).getHwsNumber()).toBe(6);
  });

  // getRanksGroupNumbers describe cuántos equipos quedan clasificados por "corte"
  // de ronda. Para 8 participantes y 3 rondas: [1,1,2,4] (campeón, finalista,
  // semifinalistas, cuartofinalistas).
  it("getRanksGroupNumbers describe los cortes por ronda", () => {
    const node = new StagePlayoffNode({ id: 'p', nodeLvl: 0, participants: 8, roundsNumber: 3, opt: 'home' });
    expect(node.getRanksGroupNumbers()).toEqual([1, 1, 2, 4]);
  });
});

// -----------------------------------------------------------------------------
// StageGroupNode / calculateParticipantsPerGroupArray — etapas de grupos (liga)
// -----------------------------------------------------------------------------
describe("calculateParticipantsPerGroupArray", () => {
  // POR QUÉ 3..20: una liga (round robin) de menos de 3 equipos no tiene sentido
  // deportivo, y de más de 20 es demasiado larga (además la tabla de scheduling
  // solo soporta hasta 20). El reparto busca grupos equilibrados.
  it("reparte participantes en grupos equilibrados", () => {
    // 16 participantes en 4 grupos -> [4,4,4,4]
    expect(calculateParticipantsPerGroupArray(16, 4)).toEqual([4, 4, 4, 4]);
  });

  it("lanza si quedan menos de 3 participantes por grupo", () => {
    // 4 participantes en 2 grupos -> 2 por grupo -> lanza
    expect(() => calculateParticipantsPerGroupArray(4, 2)).toThrow(/menos de 3/);
  });

  it("lanza si quedan más de 20 participantes por grupo", () => {
    // 42 participantes en 2 grupos -> 21 por grupo -> lanza
    expect(() => calculateParticipantsPerGroupArray(42, 2)).toThrow(/mas de 20/);
  });

  it("StageGroupNode valida el reparto en su constructor", () => {
    expect(() => new StageGroupNode({
      id: 'grp', nodeLvl: 0, participants: 16, groupsNumber: 4, opt: 'h&a',
    })).not.toThrow();
    expect(() => new StageGroupNode({
      id: 'grp', nodeLvl: 0, participants: 4, groupsNumber: 2, opt: 'h&a',
    })).toThrow();
  });

  // getHwsNumber de un grupo: se juega round robin del grupo más grande.
  // n equipos -> n-1 fechas (si n es par) o n (si n es impar, hay descanso);
  // el código usa: si par -> n-1, si impar -> n; x2 si ida y vuelta.
  it("StageGroupNode.getHwsNumber calcula las fechas del round robin", () => {
    // 16 en 4 grupos -> grupo de 4 -> par -> 4-1 = 3 fechas; h&a -> 6
    const node = new StageGroupNode({ id: 'g', nodeLvl: 0, participants: 16, groupsNumber: 4, opt: 'h&a' });
    expect(node.getHwsNumber()).toBe(6);
  });
});

// -----------------------------------------------------------------------------
// TableStageNode — divide un ranking en clasificados / eliminados
// -----------------------------------------------------------------------------
describe("TableStageNode", () => {
  // POR QUÉ recibe exactamente 1 ranking: una "tabla" parte UNA lista de
  // posiciones en dos (los primeros qNumber quedan en un ranking; el resto en
  // otro). No tiene sentido dividir dos rankings a la vez.
  //
  // OJO (posible inconsistencia a revisar para el frontend): la validación del
  // constructor es `if (participants > qNumber) throw`, es decir exige
  // participants <= qNumber. Dado que `getRanksGroups` corta en `qNumber`
  // (`items.slice(0, qNumber)` y `items.slice(qNumber)`), si participants <=
  // qNumber el segundo grupo SIEMPRE queda vacío. Esto sugiere que la intención
  // real podría ser la inversa (qNumber < participants, para partir en dos no
  // vacíos). Los tests fijan el comportamiento ACTUAL del código y dejan
  // registrada la duda; conviene confirmar la semántica antes de exponerlo en
  // la UI. (Ver Q.md / seguimiento.)
  it("con participants <= qNumber construye (comportamiento actual) y el corte deja el resto vacío", () => {
    const node = new TableStageNode(
      { id: 'tbl', nodeLvl: 0, participants: 8, qNumber: 8 },
      [rankingOfSize('src', 8)],
    );
    const out = node.getRanksGroups();
    expect(out).toHaveLength(2);
    expect(out[0].size).toBe(8); // primeros qNumber (todos)
    expect(out[1].size).toBe(0); // resto (vacío, por la invariante actual)
  });

  it("lanza si recibe una cantidad de rankings distinta de 1", () => {
    expect(() => new TableStageNode(
      { id: 'tbl', nodeLvl: 0, participants: 8, qNumber: 8 },
      [rankingOfSize('a', 4), rankingOfSize('b', 4)],
    )).toThrow();
  });

  it("lanza si participants > qNumber (invariante actual del constructor)", () => {
    expect(() => new TableStageNode(
      { id: 'tbl', nodeLvl: 0, participants: 10, qNumber: 4 },
      [rankingOfSize('src', 10)],
    )).toThrow();
  });
});

// -----------------------------------------------------------------------------
// TransferStageNode — transferencia directa (sin cambios)
// -----------------------------------------------------------------------------
describe("TransferStageNode", () => {
  // POR QUÉ existe: a veces hay que "pasar" un ranking de una fase a otra sin
  // jugar nada (reorganizar el flujo del grafo). No modifica nada ni consume
  // tiempo (getHwsNumber = 0).
  it("devuelve los mismos rankings que recibe", () => {
    const r = [rankingOfSize('src', 4)];
    const node = new TransferStageNode({ id: 'trf', nodeLvl: 0, participants: 4 }, r);
    expect(node.getRanksGroups()).toBe(r);
    expect(node.getHwsNumber()).toBe(0);
  });
});

// -----------------------------------------------------------------------------
// ReOrderStageNode — invierte el orden de dos rankings
// -----------------------------------------------------------------------------
describe("ReOrderStageNode", () => {
  // POR QUÉ exactamente 2: reordena/intercambia dos rankings (ej. cruzar
  // primeros de un grupo con segundos de otro).
  it("devuelve los dos rankings en orden inverso", () => {
    const a = rankingOfSize('a', 4);
    const b = rankingOfSize('b', 4);
    const node = new ReOrderStageNode({ id: 'ror', nodeLvl: 0, participants: 8, qNumber: 0 }, [a, b]);
    expect(node.getRanksGroups()).toEqual([b, a]);
  });

  it("lanza si no recibe exactamente 2 rankings", () => {
    expect(() => new ReOrderStageNode(
      { id: 'ror', nodeLvl: 0, participants: 4, qNumber: 0 },
      [rankingOfSize('a', 4)],
    )).toThrow();
  });
});

// -----------------------------------------------------------------------------
// RankGroupNode — envuelve un ranking concreto (nodo "negro" del grafo)
// -----------------------------------------------------------------------------
describe("RankGroupNode", () => {
  // Es el nodo que transporta un ranking por una arista. getRanksGroups()
  // devuelve exactamente ese ranking.
  it("expone el ranking que envuelve", () => {
    const r = rankingOfSize('rg', 4);
    const node = new RankGroupNode({ id: 'r_x_1', nodeLvl: 0, sourceData: r });
    expect(node.getRanksGroups()).toEqual([r]);
  });
});
