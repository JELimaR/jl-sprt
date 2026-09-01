import { JCalendar } from "jl-calendar";
import { RankingStore } from "../JSportModule/Ranking/RankingStore";

/**
 * Contexto de una simulación.
 *
 * Agrupa las dos dependencias que atraviesan toda la construcción de un torneo
 * (calendario + store de rankings finalizados) y que comparten el mismo ciclo de
 * vida: una simulación / temporada.
 *
 * Antes, el store de rankings era un singleton de módulo (`globalFinishedRankingsMap`),
 * lo que hacía que distintas corridas (y los tests) compartieran estado global. Ahora
 * el store se inyecta a través de este contexto, que se threadea por
 * `Tournament -> Phase -> Stage -> Event`, igual que el calendario.
 */
export class SimulationContext {
  readonly calendar: JCalendar;
  readonly store: RankingStore;

  constructor(calendar: JCalendar, store: RankingStore = new RankingStore()) {
    this.calendar = calendar;
    this.store = store;
  }
}

/**
 * Crea un contexto de simulación nuevo con un store vacío.
 */
export function createSimulationContext(calendar: JCalendar, store?: RankingStore): SimulationContext {
  return new SimulationContext(calendar, store);
}
