import { IElementHandler } from "../../JSportModule";
import { SimulationContext } from "../../Tournament/SimulationContext";
import { Tournament } from "../../Tournament/Tournament";
import { SportWorld } from "../../World/SportWorld";
import { TSport } from "jl-sprt-match";

/**
 * Estado de UNA sesión de simulación de torneo, dentro de un `SportWorld`.
 *
 * La sesión referencia el **mundo** (`world`: dueño del calendario + rankings +
 * entidades, ver docs/plans/SPORT_WORLD.md) y los **torneos** que la simulación creó
 * en ese mundo. En la Fase A hay un único torneo (la liga simple), pero el modelo ya
 * admite varios (`tournaments`).
 *
 * Es estado INTERNO del server: nunca cruza la frontera de la API (lo que sale son
 * DTOs planos).
 *
 * NOTA sobre nombres de team: NO se guarda ningún mapa `teamId -> nombre`. El nombre
 * legible lo expone el propio team (`A_Team.name`, derivado de su `Institution`). El
 * parche `teamNames` de la Fase A se eliminó.
 *
 * NOTA sobre stages: la sesión referencia el `Tournament`, que conoce sus stages vía
 * `tournament.stagesMap` (`Map<string, TGS>`). Los DTOs se arman recorriendo esa
 * estructura de forma genérica (StageGroup / StagePlayoff).
 */
export interface ISimulationSession {
  id: string;
  /** El mundo donde vive la simulación (calendario + rankings + entidades). */
  world: SportWorld;
  /** Vista del mundo hacia el motor de torneos (calendar + store + tournament configs). */
  ctx: SimulationContext;
  sport: TSport;
  /** Torneos de la sesión, por `tournamentId`. Fase A: un solo torneo. */
  tournaments: Map<string, Tournament>;
}

/**
 * ElementHandler — dueño del estado de las simulaciones.
 *
 * Mantiene un `Map<simulationId, ISimulationSession>`. El controller orquesta
 * (crea torneos, avanza, arma DTOs); el handler solo guarda y recupera sesiones.
 *
 * NOTA (futuro DB): hoy las sesiones viven en memoria del proceso. Como el contrato
 * de la API es por DTOs + `simulationId`, migrar este almacenamiento a DB no
 * afectará ni el contrato ni el front.
 */
export class ElementHandler implements IElementHandler {
  /**
   * Patron Singleton
   */
  private static _instance: ElementHandler;
  private constructor() { }
  static get instance(): ElementHandler {
    if (!this._instance)
      this._instance = new ElementHandler();
    return this._instance;
  }

  private _sessions: Map<string, ISimulationSession> = new Map();
  private _seq = 0;

  /** Genera un id único de simulación para esta instancia del proceso. */
  genId(): string {
    this._seq++;
    return `sim_${Date.now().toString(36)}_${this._seq}`;
  }

  /** Registra una sesión. */
  add(session: ISimulationSession): void {
    this._sessions.set(session.id, session);
  }

  /** Devuelve la sesión o undefined si no existe. */
  find(simulationId: string): ISimulationSession | undefined {
    return this._sessions.get(simulationId);
  }

  /**
   * Devuelve la sesión o lanza si no existe. Usar en operaciones que requieren una
   * simulación válida (comandos y queries de estado).
   */
  require(simulationId: string): ISimulationSession {
    const s = this._sessions.get(simulationId);
    if (!s) {
      throw new Error(`No existe la simulación "${simulationId}". En ElementHandler.require`);
    }
    return s;
  }

  /** Elimina una sesión. Devuelve true si existía. */
  remove(simulationId: string): boolean {
    return this._sessions.delete(simulationId);
  }
}
