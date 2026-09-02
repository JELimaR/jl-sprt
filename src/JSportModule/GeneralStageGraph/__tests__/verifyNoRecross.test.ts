import { describe, it, expect } from "vitest";
import { createGSG, TInitialCreator, TPhaseCreator } from "../GSGCreators";
import { verifyNoRecross } from "../verifyNoRecross";
import { IGenericRankItem } from "../../Ranking/interfaces";

// =============================================================================
// Principio B — "no re-cruzar ramas bifurcadas" (verifyNoRecross)
//
// Ver docs/plans/PRINCIPLE_B_NO_RECROSS.md. La regla: el torneo tiene un ORDEN
// GLOBAL de ranking; cada stage debe consumir un RANGO CONTIGUO de ese orden.
// Juntar ramas no contiguas (con un "hueco" ocupado por ramas que fueron a otro
// stage) es re-cruzar ramas ya separadas.
//
// Excepciones:
//   - Ramas EXTERNAS (entrantes de otro torneo, origin rs_/tr_ ajeno en el
//     qualyRankList inicial) quedan exentas de la contigüidad: pueden juntarse
//     con cualquier bloque interno (caso copa / UEFA).
//   - reOrder solo es legítimo si una de sus fuentes es externa; reordenar dos
//     ramas internas re-cruza ramas.
//
// Estos tests corren verifyNoRecross directamente sobre el GSG construido con
// createGSG, aislándolo del cálculo de fechas de tournamentFromGSG.
// =============================================================================

/** qualyRankList de N posiciones desde un único origen interno de federación. */
function frQualy(n: number, origin = 'fr_S_TEST'): IGenericRankItem[] {
  return Array.from({ length: n }, (_, i) => ({ origin, pos: i + 1 }));
}

describe("verifyNoRecross - Principio B", () => {
  // ---------------------------------------------------------------------------
  // 1. VÁLIDO — 6 grupos -> 6 primeros directo + repechaje de los 6 segundos ->
  //    playoff de 8. Ejemplo canónico del usuario.
  //    Grupos 6x4 (24 teams) emiten [1ros(6), 2dos(6), 3ros(6), 4tos(6)].
  //    Fase 2: 1ros pasan (transfer); 2dos -> repechaje (playoff 1 ronda: de 6
  //    salen 3 ganadores... usamos 6 -> se juega y produce su ranking). Para que
  //    el playoff final sea de 8 usamos: 6 primeros + 2 del repechaje.
  // ---------------------------------------------------------------------------
  it("acepta el clásico 6 grupos -> repechaje -> eliminatoria (ramas que confluyen)", () => {
    // 24 teams, un solo rank group inicial.
    const ini: TInitialCreator = {
      tournamentId: 'SIX',
      qualyrankList: frQualy(24),
      rankGroupNumbers: [24],
    };
    const phases: TPhaseCreator[] = [
      // Fase 1: 6 grupos de 4 (h&a). Emite [1ros(6), 2dos(6), 3ros(6), 4tos(6)].
      { id: 1, stages: [{ count: 1, stage: { type: 'group', value: 6, opt: 'h&a' } }] },
      // Fase 2: 1ros(6) transfer; 2dos(6) van a un table que separa 2 (repechaje)
      // del resto; 3ros y 4tos transfer al final.
      {
        id: 2,
        stages: [
          { count: 1, stage: { type: 'transfer' } }, // 1ros
          { count: 1, stage: { type: 'group', value: 2, opt: 'h&a' } }, // 2dos -> repechaje (2 grupos de 3)
          { count: 1, stage: { type: 'transfer' } }, // 3ros
          { count: 1, stage: { type: 'transfer' } }, // 4tos
        ],
      },
    ];
    const gsg = createGSG(ini, phases);
    expect(() => verifyNoRecross(gsg)).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // 2. VÁLIDO — liga simple de un solo grupo: nada que re-cruzar.
  // ---------------------------------------------------------------------------
  it("acepta una liga simple de un grupo", () => {
    const ini: TInitialCreator = {
      tournamentId: 'LIG',
      qualyrankList: frQualy(8),
      rankGroupNumbers: [8],
    };
    const phases: TPhaseCreator[] = [
      { id: 1, stages: [{ count: 1, stage: { type: 'group', value: 1, opt: 'h&a' } }] },
    ];
    const gsg = createGSG(ini, phases);
    expect(() => verifyNoRecross(gsg)).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // 3. INVÁLIDO — reOrder entre dos ramas INTERNAS del mismo torneo.
  //    Un grupo emite 1ros y 2dos (ambos internos). Un reOrder que los intercambia
  //    reordena dos ramas ya bifurcadas del mismo torneo -> re-cruce.
  // ---------------------------------------------------------------------------
  it("rechaza un reOrder entre dos ramas internas", () => {
    const ini: TInitialCreator = {
      tournamentId: 'BAD',
      qualyrankList: frQualy(8),
      rankGroupNumbers: [8],
    };
    const phases: TPhaseCreator[] = [
      // Fase 1: grupo de 8 (2 grupos de 4) -> emite [1ros(2), 2dos(2), 3ros(2), 4tos(2)].
      { id: 1, stages: [{ count: 1, stage: { type: 'group', value: 2, opt: 'h&a' } }] },
      // Fase 2: reOrder sobre las 2 primeras ramas (1ros y 2dos), ambas internas.
      {
        id: 2,
        stages: [
          { count: 2, stage: { type: 'reOrder', value: 2 } }, // 1ros + 2dos internos
          { count: 1, stage: { type: 'transfer' } },
          { count: 1, stage: { type: 'transfer' } },
        ],
      },
    ];
    const gsg = createGSG(ini, phases);
    expect(() => verifyNoRecross(gsg)).toThrow(/reOrder|internas/i);
  });

  // ---------------------------------------------------------------------------
  // 4. VÁLIDO — reOrder con una fuente EXTERNA (torneo acoplado tipo UEFA).
  //    El ranking inicial trae entrantes externos (origin rs_ de OTRO torneo) en
  //    las primeras posiciones, y locales (fr_) en el resto. El reOrder cruza el
  //    entrante externo con la primera rama local: permitido.
  // ---------------------------------------------------------------------------
  it("acepta un reOrder cuando una fuente es externa (entrantes de otro torneo)", () => {
    // 8 entrantes externos (rs_ de OTRO torneo) + 8 locales.
    const entrantes: IGenericRankItem[] = Array.from({ length: 8 }, (_, i) => ({
      origin: 'rs_OTHER_p01_s01', // rs_ de un torneo ajeno -> externo
      pos: i + 1,
    }));
    const locales: IGenericRankItem[] = Array.from({ length: 8 }, (_, i) => ({
      origin: 'fr_S_TEST',
      pos: i + 1,
    }));
    const ini: TInitialCreator = {
      tournamentId: 'UEFA',
      qualyrankList: [...entrantes, ...locales],
      rankGroupNumbers: [8, 8], // [entrantes(8) externos, locales(8) internos]
    };
    const phases: TPhaseCreator[] = [
      // Fase 1: entrantes transfer; locales -> grupo de 8 (2x4).
      {
        id: 1,
        stages: [
          { count: 1, stage: { type: 'transfer' } }, // entrantes externos
          { count: 1, stage: { type: 'group', value: 2, opt: 'h&a' } }, // locales
        ],
      },
      // Fase 2: reOrder(entrantes externos, 1ros locales) + transfers del resto.
      // La fase 1 emite 5 RG: entrantes(1) + [1ros,2dos,3ros,4tos] del grupo.
      {
        id: 2,
        stages: [
          { count: 2, stage: { type: 'reOrder', value: 8 } }, // externo + 1ros locales
          { count: 1, stage: { type: 'transfer' } }, // 2dos
          { count: 1, stage: { type: 'transfer' } }, // 3ros
          { count: 1, stage: { type: 'transfer' } }, // 4tos
        ],
      },
    ];
    const gsg = createGSG(ini, phases);
    expect(() => verifyNoRecross(gsg)).not.toThrow();
  });
});
