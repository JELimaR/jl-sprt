import { describe, it, expect } from "vitest";
import confederationExample from "../../examples/confederationExample";
import { reseedRandom } from "../../JSportModule/Match/randomSource";

// -----------------------------------------------------------------------------
// Integración — torneos acoplados (Champions A -> Europa B)
//
// Verifica el cierre end-to-end de la Fase B: dos torneos en un mismo
// SimulationContext, donde B tiene 8 entrantes (los 3ros de A) que NO se conocen
// al crearlo. teamsAssign difiere esos orígenes y los resuelve cuando la fase de
// grupos de A termina; el ReOrderStageNode acomoda el cruce. B debe correr hasta
// la final sin lanzar (antes esto era imposible: asignarTeams2 lanzaba al crear B).
//
// Determinista con reseedRandom(13).
// -----------------------------------------------------------------------------
describe("Integración - torneos de confederación acoplados (A -> B)", () => {
  it("corre A y B acoplados end-to-end sin lanzar (resolución diferida + reOrder)", () => {
    reseedRandom(13);
    expect(() => confederationExample()).not.toThrow();
  });
});
