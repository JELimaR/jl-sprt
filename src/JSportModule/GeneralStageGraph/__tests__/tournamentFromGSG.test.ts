import { describe, it, expect } from "vitest";
import { tournamentFromGSG, ITournamentFromGSGData } from "../tournamentFromGSG";
import { createGSG } from "../GSGCreators";
import { verifyQualyRulesConditions } from "../verifyQualyRulesConditions";

// =============================================================================
// Capa 2 — tournamentFromGSG y verifyQualyRulesConditions
//
// tournamentFromGSG convierte un GSG (estructura declarativa) en un
// ITournamentConfig ejecutable: reparte las half-weeks disponibles entre las
// etapas, arma las phases/stages, y propaga las condiciones de clasificación
// (qualifyConditions) que le dicen a cada etapa DE DÓNDE saca sus equipos.
//
// Es el puente entre "el dibujo del torneo" (grafo) y "el torneo jugable"
// (config). El frontend construirá el grafo; esta función lo valida y lo
// materializa.
// =============================================================================

/**
 * Config de una liga de 8 equipos, ida y vuelta (1 grupo). Un grupo de 8 (par)
 * en round robin h&a necesita (8-1)*2 = 14 fechas, por eso matchList/schedList
 * tienen 14 entradas.
 */
function leagueGSGData(): ITournamentFromGSGData {
  return {
    name: 'Liga Test',
    gsgData: {
      initialCreator: {
        tournamentId: 'S_FTEST_D01',
        qualyrankList: Array.from({ length: 8 }, (_, i) => ({ origin: 'fr_S_FTEST', pos: i + 1 })),
        rankGroupNumbers: [8],
      },
      phaseArr: [
        { id: 1, stages: [{ count: 1, stage: { type: 'group', opt: 'h&a', value: 1 } }] },
      ],
    },
    matchList: [28, 32, 36, 40, 44, 48, 52, 70, 74, 78, 82, 86, 90, 94],
    schedList: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
    qualyRules: [],
  };
}

// -----------------------------------------------------------------------------
// Conversión GSG -> ITournamentConfig
// -----------------------------------------------------------------------------
describe("tournamentFromGSG - conversión", () => {
  it("convierte un GSG válido en un ITournamentConfig", () => {
    const config = tournamentFromGSG(leagueGSGData());
    // el idConfig del torneo es el tournamentId del GSG
    expect(config.idConfig).toBe('S_FTEST_D01');
    // produce exactamente una phase (la fase con el grupo)
    expect(config.phases).toHaveLength(1);
  });

  it("la phase contiene el stage de grupo con sus qualifyConditions", () => {
    const config = tournamentFromGSG(leagueGSGData());
    const phase = config.phases[0];
    expect(phase.stages).toHaveLength(1);

    const stage = phase.stages[0];
    expect(stage.type).toBe('group');
    // POR QUÉ qualifyConditions: le dicen a la etapa de dónde vienen sus equipos.
    // El grupo toma sus 8 equipos del ranking inicial del torneo (ini_...).
    expect(stage.qualifyConditions.length).toBeGreaterThan(0);
    const totalQualy = stage.qualifyConditions.reduce(
      (acc, qc) => acc + (qc.maxRankPos - qc.minRankPos + 1), 0);
    expect(totalQualy).toBe(8);
  });

  it("las fechas del torneo salen de schedList (start) y matchList (end)", () => {
    const config = tournamentFromGSG(leagueGSGData());
    expect(config.hwStart).toBe(16); // primer schedList
    expect(config.hwEnd).toBe(94);   // último matchList
  });
});

// -----------------------------------------------------------------------------
// Validación de "torneo bien definido" (camino ini -> fin)
// -----------------------------------------------------------------------------
describe("tournamentFromGSG - validaciones", () => {
  // POR QUÉ: tournamentFromGSG verifica que exista un camino desde el último
  // rank group inicial hasta el primer rank group final. Es la garantía de que
  // "el que entra clasificado más abajo puede, en principio, llegar arriba":
  // el torneo está conectado de punta a punta. Un grafo válido lo cumple.
  it("un GSG conectado no lanza", () => {
    expect(() => tournamentFromGSG(leagueGSGData())).not.toThrow();
  });
});

// -----------------------------------------------------------------------------
// verifyQualyRulesConditions — reglas sobre el ranking final del torneo
// -----------------------------------------------------------------------------
describe("verifyQualyRulesConditions", () => {
  // Las qualyRules describen cortes sobre el RANKING FINAL del torneo (ej:
  // "los que salen 1..2 ascienden"). El GSG del grupo de 8 produce 8 rank groups
  // finales de 1 posición cada uno (una posición por puesto del grupo).
  //
  // POR QUÉ la validación: una qualyRule debe (a) estar dentro del rango de
  // posiciones existentes, y (b) componerse EXACTAMENTE por la unión de rank
  // groups finales completos (no puede "cortar" un rank group por la mitad).
  // Como acá cada rank group final tiene 1 sola posición, cualquier rango
  // contiguo es unión exacta de rank groups.
  function groupFinalGSG() {
    return createGSG(
      {
        tournamentId: 'T_QR',
        qualyrankList: Array.from({ length: 8 }, (_, i) => ({ origin: 'fr', pos: i + 1 })),
        rankGroupNumbers: [8],
      },
      [{ id: 1, stages: [{ count: 1, stage: { type: 'group', opt: 'h&a', value: 1 } }] }],
    );
  }

  it("acepta una qualyRule dentro del rango y alineada a rank groups", () => {
    const gsg = groupFinalGSG();
    expect(() => verifyQualyRulesConditions(gsg, [{ minRankPos: 1, maxRankPos: 2 }])).not.toThrow();
  });

  it("lanza si la qualyRule excede el tamaño del torneo", () => {
    const gsg = groupFinalGSG();
    // el torneo tiene 8 posiciones; pedir hasta la 20 excede -> lanza
    expect(() => verifyQualyRulesConditions(gsg, [{ minRankPos: 1, maxRankPos: 20 }])).toThrow();
  });

  it("lanza si min/max están invertidos o fuera de rango", () => {
    const gsg = groupFinalGSG();
    expect(() => verifyQualyRulesConditions(gsg, [{ minRankPos: 5, maxRankPos: 3 }])).toThrow();
    expect(() => verifyQualyRulesConditions(gsg, [{ minRankPos: 0, maxRankPos: 2 }])).toThrow();
  });
});
