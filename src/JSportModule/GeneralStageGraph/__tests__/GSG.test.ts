import { describe, it, expect } from "vitest";
import { createGSG, TInitialCreator, TPhaseCreator } from "../GSGCreators";
import { GeneralStageGraph } from "../GeneralStageGraph";
import { IGenericRankItem } from "../../Ranking";

// =============================================================================
// Capa 2 — GeneralStageGraph (construcción, aristas y consultas)
//
// createGSG(iniCreator, phaseArr) arma el grafo completo:
//   INI --(RankGroupNodes)--> [stages de la fase 1] --(RGs)--> ... --> FIN
//
// Reglas estructurales que el grafo garantiza (y que el frontend deberá
// respetar al construir un torneo visualmente):
//   - Cada nodo de etapa/procesamiento genera automáticamente sus RankGroupNodes
//     de salida (los "puertos" de donde salen los equipos clasificados).
//   - Toda arista conecta un RankGroupNode con un no-RankGroupNode (nunca dos
//     del mismo tipo): el flujo es siempre "grupo de ranking" -> "etapa" ->
//     "grupo de ranking" -> "etapa" ...
//   - La cantidad de rank groups que consume una fase debe coincidir con la que
//     produjo la fase anterior (verifyPhaseCreator).
// =============================================================================

/** qualyRankList de N posiciones, todas desde el mismo origen (la federación, etc.). */
function qualyList(n: number, origin = 'fr_TEST'): IGenericRankItem[] {
  return Array.from({ length: n }, (_, i) => ({ origin, pos: i + 1 }));
}

/**
 * El GSG más mínimo válido: N clasificados en un solo rank group inicial, y una
 * única fase con un solo stage 'transfer' (no juega nada, solo transfiere el
 * ranking hacia el FIN). Sirve para probar la construcción y las consultas sin
 * el ruido de una etapa real.
 */
function buildMinimalGSG(n = 8): GeneralStageGraph {
  const ini: TInitialCreator = {
    tournamentId: 'T_MIN',
    qualyrankList: qualyList(n),
    rankGroupNumbers: [n], // un solo grupo con los n clasificados
  };
  const phases: TPhaseCreator[] = [
    { id: 1, stages: [{ count: 1, stage: { type: 'transfer' } }] },
  ];
  return createGSG(ini, phases);
}

/**
 * Un GSG con una etapa de grupos real: 8 equipos, 1 grupo (round robin h&a).
 * El grupo produce 8 rank groups de salida (uno por posición), que van al FIN.
 */
function buildGroupGSG(): GeneralStageGraph {
  const ini: TInitialCreator = {
    tournamentId: 'T_GRP',
    qualyrankList: qualyList(8),
    rankGroupNumbers: [8],
  };
  const phases: TPhaseCreator[] = [
    { id: 1, stages: [{ count: 1, stage: { type: 'group', value: 1, opt: 'h&a' } }] },
  ];
  return createGSG(ini, phases);
}

// -----------------------------------------------------------------------------
// Construcción básica
// -----------------------------------------------------------------------------
describe("createGSG - construcción", () => {
  it("construye un grafo mínimo válido (INI -> RG -> transfer -> RG -> FIN)", () => {
    const gsg = buildMinimalGSG(8);
    expect(gsg.id).toBe('T_MIN');
    // tiene nodos 'ini' y 'fin'
    expect(gsg.getNode('ini')).toBeDefined();
    expect(gsg.getNode('fin')).toBeDefined();
  });

  it("getTournamentId devuelve el id del InitialNode", () => {
    expect(buildMinimalGSG().getTournamentId()).toBe('T_MIN');
  });

  it("registra la fase declarada", () => {
    const gsg = buildMinimalGSG();
    expect(gsg.phases).toHaveLength(1);
  });
});

// -----------------------------------------------------------------------------
// verifyPhaseCreator — coherencia de rank groups entre fases
// -----------------------------------------------------------------------------
describe("createGSG - coherencia entre fases", () => {
  // POR QUÉ: cada stage de una fase consume `count` rank groups de la fase
  // anterior. La suma de esos `count` debe igualar la cantidad de rank groups
  // que la fase anterior (o el INI) produjo. Si no, el flujo no cierra.
  it("lanza si una fase consume distinta cantidad de rank groups que la anterior produjo", () => {
    const ini: TInitialCreator = {
      tournamentId: 'T', qualyrankList: qualyList(8), rankGroupNumbers: [8], // INI produce 1 RG
    };
    const phases: TPhaseCreator[] = [
      // la fase pide 2 stages (consume 2 RGs) pero el INI solo produjo 1 -> lanza
      { id: 1, stages: [
        { count: 1, stage: { type: 'transfer' } },
        { count: 1, stage: { type: 'transfer' } },
      ] },
    ];
    expect(() => createGSG(ini, phases)).toThrow();
  });

  it("acepta cuando el consumo coincide con la producción previa", () => {
    const ini: TInitialCreator = {
      tournamentId: 'T', qualyrankList: qualyList(8), rankGroupNumbers: [4, 4], // INI produce 2 RGs
    };
    const phases: TPhaseCreator[] = [
      { id: 1, stages: [
        { count: 1, stage: { type: 'transfer' } },
        { count: 1, stage: { type: 'transfer' } },
      ] }, // consume 2 -> OK
    ];
    expect(() => createGSG(ini, phases)).not.toThrow();
  });
});

// -----------------------------------------------------------------------------
// Aristas — addDirectedEdge (invariante RGN <-> no-RGN)
// -----------------------------------------------------------------------------
describe("GeneralStageGraph.addDirectedEdge", () => {
  // POR QUÉ: el grafo alterna estrictamente RankGroupNode <-> otro tipo. Conectar
  // dos nodos del mismo "bando" (ambos RGN o ninguno RGN) rompe el modelo de
  // flujo. Como los nodos internos crean sus propios RGN, el error se expone
  // intentando conectar dos nodos NO-RGN entre sí.
  it("lanza al conectar dos nodos del mismo tipo (ambos no-RankGroup)", () => {
    const gsg = buildMinimalGSG(8);
    const ini = gsg.getNode('ini');
    const fin = gsg.getNode('fin');
    // ini (no-RGN) y fin (no-RGN) son del mismo tipo -> arista inválida
    expect(() => gsg.addDirectedEdge(ini, fin)).toThrow(/mismo tipo/);
  });
});

// -----------------------------------------------------------------------------
// Consultas de rankings
// -----------------------------------------------------------------------------
describe("GeneralStageGraph - rankings", () => {
  it("getQualyRankList devuelve la lista de clasificados del INI", () => {
    const gsg = buildMinimalGSG(8);
    const list = gsg.getQualyRankList();
    expect(list).toHaveLength(8);
    expect(list.every(i => i.origin === 'fr_TEST')).toBe(true);
  });

  it("getInitialRankings devuelve los rank groups del INI", () => {
    const gsg = buildMinimalGSG(8);
    const initial = gsg.getInitialRankings();
    // rankGroupNumbers: [8] -> un solo ranking inicial de tamaño 8
    expect(initial).toHaveLength(1);
    expect(initial[0].size).toBe(8);
  });

  it("getFinalRankings devuelve los rankings que llegan al FIN", () => {
    // En el grafo mínimo, el transfer transfiere el único ranking de 8 al FIN.
    const gsg = buildMinimalGSG(8);
    const finals = gsg.getFinalRankings();
    const totalPositions = finals.reduce((acc, r) => acc + r.size, 0);
    expect(totalPositions).toBe(8);
  });

  it("un StageGroup produce un rank group por posición (8 grupos de 1)", () => {
    // Un grupo de 8 -> 8 posiciones finales -> 8 rank groups de salida.
    const gsg = buildGroupGSG();
    const finals = gsg.getFinalRankings();
    const totalPositions = finals.reduce((acc, r) => acc + r.size, 0);
    expect(totalPositions).toBe(8);
  });
});

// -----------------------------------------------------------------------------
// Caminos y duración
// -----------------------------------------------------------------------------
describe("GeneralStageGraph - caminos y duración", () => {
  it("getAllSimplePath('ini','fin') encuentra al menos un camino en un grafo válido", () => {
    const gsg = buildMinimalGSG(8);
    const paths = gsg.getAllSimplePath('ini', 'fin');
    expect(paths.length).toBeGreaterThan(0);
  });

  // POR QUÉ getHwsNumberMinimum = Math.max de los caminos: representa el "mínimo
  // tiempo necesario para completar el torneo", que es la duración del camino
  // más largo (camino crítico). El torneo no puede terminar antes que su rama
  // más larga. En el grafo mínimo (solo transfers, 0 fechas) el resultado es 0.
  it("getHwsNumberMinimum del grafo mínimo (solo transfers) es 0", () => {
    expect(buildMinimalGSG(8).getHwsNumberMinimum()).toBe(0);
  });

  it("getHwsNumberMinimum refleja las fechas de una etapa real", () => {
    // Grupo de 8 (par) round robin h&a -> (8-1)*2 = 14 fechas.
    const gsg = buildGroupGSG();
    expect(gsg.getHwsNumberMinimum()).toBe(14);
  });
});
