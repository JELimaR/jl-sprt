import { JCalendar } from "jl-calendar";
import { RankingStore } from "../JSportModule/Ranking/RankingStore";
import { TournamentConfigStore } from "./TournamentConfigStore";

/**
 * Contexto de una simulación.
 *
 * Agrupa las dependencias que atraviesan toda la construcción de un torneo y que
 * comparten el mismo ciclo de vida (una simulación / temporada):
 *  - `calendar`: el calendario donde se agendan y disparan los eventos.
 *  - `store`: el registro de rankings finalizados (`rs_`, `tr_`, `fr_`, `ini_`).
 *  - `tournaments`: el registro de configs de torneos (`ITournamentConfig` por
 *    `idConfig`). Análogo al `store` pero para "qué torneos existen y cómo se
 *    relacionan"; es el prerrequisito de la validación cross-tournament y de la
 *    resolución diferida de equipos (ver docs/plans/RUNTIME_VALIDATIONS.md §7).
 *
 * Antes, el store de rankings era un singleton de módulo (`globalFinishedRankingsMap`),
 * lo que hacía que distintas corridas (y los tests) compartieran estado global. Ahora
 * las dependencias se inyectan a través de este contexto, que se threadea por
 * `Tournament -> Phase -> Stage -> Event`, igual que el calendario.
 */
export class SimulationContext {
  readonly calendar: JCalendar;
  readonly store: RankingStore;
  readonly tournaments: TournamentConfigStore;

  constructor(
    calendar: JCalendar,
    store: RankingStore = new RankingStore(),
    tournaments: TournamentConfigStore = new TournamentConfigStore(),
  ) {
    this.calendar = calendar;
    this.store = store;
    this.tournaments = tournaments;
  }
}

/**
 * Crea un contexto de simulación nuevo con stores vacíos.
 */
export function createSimulationContext(
  calendar: JCalendar,
  store?: RankingStore,
  tournaments?: TournamentConfigStore,
): SimulationContext {
  return new SimulationContext(calendar, store, tournaments);
}
