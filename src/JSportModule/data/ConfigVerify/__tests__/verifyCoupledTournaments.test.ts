import { describe, it, expect } from "vitest";
import { verifyCoupledTournaments, resolveTournamentBuildOrder } from "../verifyCoupledTournaments";
import { ITournamentConfig, IStageConfig, TQualyCondition } from "../../../data";

// -----------------------------------------------------------------------------
// Helpers
//
// verifyCoupledTournaments solo lee de cada config:
//  - idConfig, hwStart, hwEnd (torneo)
//  - phases[].stages[]: idConfig, hwStart, hwEnd, qualifyConditions[].rankId
// Construimos configs mínimos con esos campos y casteamos.
// -----------------------------------------------------------------------------
function qc(rankId: string): TQualyCondition {
  return { rankId, season: "current", minRankPos: 1, maxRankPos: 8 } as unknown as TQualyCondition;
}

function stage(idConfig: string, hwStart: number, hwEnd: number, sources: string[] = []): IStageConfig {
  return {
    idConfig,
    hwStart,
    hwEnd,
    qualifyConditions: sources.map(qc),
  } as unknown as IStageConfig;
}

/** Torneo mínimo con una sola phase que contiene los stages dados. */
function tournament(idConfig: string, hwStart: number, hwEnd: number, stages: IStageConfig[]): ITournamentConfig {
  return {
    idConfig,
    hwStart,
    hwEnd,
    phases: [{ stages }],
  } as unknown as ITournamentConfig;
}

// -----------------------------------------------------------------------------
// Torneos independientes (sin dependencias cross-tournament)
// -----------------------------------------------------------------------------
describe("verifyCoupledTournaments - torneos independientes", () => {
  it("acepta un conjunto sin dependencias entre torneos", () => {
    const a = tournament("A", 1, 20, [stage("A_g1", 2, 20, ["fr_F001"])]);
    const b = tournament("B", 1, 20, [stage("B_g1", 2, 20, ["fr_F002"])]);
    expect(verifyCoupledTournaments([a, b])).toBe(true);
  });

  it("ignora fuentes intra-torneo (mismo config)", () => {
    // B_cross consume rs_B_g1, que es del MISMO torneo -> no es dependencia cross.
    const b = tournament("B", 1, 40, [
      stage("B_g1", 2, 20, ["fr_F002"]),
      stage("B_cross", 22, 40, ["rs_B_g1"]),
    ]);
    expect(verifyCoupledTournaments([b])).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Caso acoplado válido A -> B (B consume rs_ de un stage de A)
// -----------------------------------------------------------------------------
describe("verifyCoupledTournaments - acoplado válido", () => {
  it("acepta A->B cuando A termina antes de que arranque el stage consumidor de B", () => {
    // A: fase de grupos termina en hw 20.
    const a = tournament("A", 1, 20, [stage("A_g1", 2, 20, ["fr_F001"])]);
    // B: el cruce arranca en hw 22 y consume rs_A_g1 (3ros de A).
    const b = tournament("B", 1, 40, [
      stage("B_g1", 2, 20, ["fr_F002"]),
      stage("B_cross", 22, 40, ["rs_A_g1"]),
    ]);
    expect(verifyCoupledTournaments([a, b])).toBe(true);
  });

  it("resolveTournamentBuildOrder pone al productor (A) antes que al consumidor (B)", () => {
    const a = tournament("A", 1, 20, [stage("A_g1", 2, 20, ["fr_F001"])]);
    const b = tournament("B", 1, 40, [stage("B_cross", 22, 40, ["rs_A_g1"])]);
    // aunque se pase B primero, A debe quedar antes en el orden
    const order = resolveTournamentBuildOrder([b, a]).map((c) => c.idConfig);
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("B"));
  });

  it("resuelve tr_<tournamentId> como dependencia cross", () => {
    const a = tournament("A", 1, 20, [stage("A_g1", 2, 20, ["fr_F001"])]);
    // B consume el ranking FINAL de A (tr_A), disponible en hwEnd de A = 20.
    const b = tournament("B", 1, 40, [stage("B_s1", 22, 40, ["tr_A"])]);
    expect(verifyCoupledTournaments([a, b])).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Desalineación temporal
// -----------------------------------------------------------------------------
describe("verifyCoupledTournaments - desalineación temporal", () => {
  it("lanza si la fuente termina DESPUÉS (o igual) de que arranca el consumidor", () => {
    // A termina en hw 20, pero el stage consumidor de B arranca en hw 20 (no antes).
    const a = tournament("A", 1, 20, [stage("A_g1", 2, 20, ["fr_F001"])]);
    const b = tournament("B", 1, 40, [stage("B_cross", 20, 40, ["rs_A_g1"])]);
    expect(() => verifyCoupledTournaments([a, b])).toThrow(/desalineación temporal/);
  });

  it("lanza si el consumidor arranca claramente antes de que la fuente termine", () => {
    const a = tournament("A", 1, 30, [stage("A_g1", 2, 30, ["fr_F001"])]);
    const b = tournament("B", 1, 40, [stage("B_cross", 10, 40, ["rs_A_g1"])]);
    expect(() => verifyCoupledTournaments([a, b])).toThrow(/desalineación temporal/);
  });
});

// -----------------------------------------------------------------------------
// Ciclos
// -----------------------------------------------------------------------------
describe("verifyCoupledTournaments - ciclos", () => {
  it("lanza si A depende de B y B depende de A", () => {
    // A consume rs_B_g1 y B consume rs_A_g1 -> ciclo.
    const a = tournament("A", 1, 40, [stage("A_g1", 22, 40, ["rs_B_g1"])]);
    const b = tournament("B", 1, 40, [stage("B_g1", 22, 40, ["rs_A_g1"])]);
    expect(() => verifyCoupledTournaments([a, b])).toThrow(/ciclo/);
  });

  it("resolveTournamentBuildOrder también lanza ante un ciclo", () => {
    const a = tournament("A", 1, 40, [stage("A_g1", 22, 40, ["rs_B_g1"])]);
    const b = tournament("B", 1, 40, [stage("B_g1", 22, 40, ["rs_A_g1"])]);
    expect(() => resolveTournamentBuildOrder([a, b])).toThrow(/ciclo/);
  });
});
