import {
  IElementController,
  ICreateSimpleLeagueInput,
  ISimulationRef,
  IAdvanceResultDTO,
  ISimulationStateDTO,
  IMatchDTO,
  IStandingRowDTO,
  ICalendarEventDTO,
  IDateTimeDTO,
} from "../../JSportModule";

/**
 * ElementController — administra simulaciones de torneo por `simulationId`.
 *
 * Paso 1 del plan (docs/plans/API_CONTROLLERS.md): solo el CONTRATO. Los métodos
 * son stubs que lanzan hasta implementar la Fase A (Paso 4). El patrón de "lanzar
 * en lo no implementado" es el mismo que usa EntityController en sus huecos.
 */
export class ElementController implements IElementController {
  /**
   * Patron Singleton
   */
  private static _instance: ElementController;
  private constructor() { }
  static get instance(): ElementController {
    if (!this._instance)
      this._instance = new ElementController();
    return this._instance;
  }

  private notImplemented(method: string): never {
    throw new Error(`ElementController.${method} aún no implementado (Fase A pendiente). Ver docs/plans/API_CONTROLLERS.md`);
  }

  // --- comandos ---
  createSimpleLeague(_input: ICreateSimpleLeagueInput): ISimulationRef {
    return this.notImplemented('createSimpleLeague');
  }
  advance(_simulationId: string): IAdvanceResultDTO {
    return this.notImplemented('advance');
  }
  runAll(_simulationId: string): IAdvanceResultDTO {
    return this.notImplemented('runAll');
  }
  dispose(_simulationId: string): boolean {
    return this.notImplemented('dispose');
  }

  // --- queries ---
  getState(_simulationId: string): ISimulationStateDTO {
    return this.notImplemented('getState');
  }
  getMatches(_simulationId: string): IMatchDTO[] {
    return this.notImplemented('getMatches');
  }
  getMatch(_simulationId: string, _matchId: string): IMatchDTO | null {
    return this.notImplemented('getMatch');
  }
  getStandings(_simulationId: string): IStandingRowDTO[] {
    return this.notImplemented('getStandings');
  }
  getCalendarEvents(_simulationId: string): ICalendarEventDTO[] {
    return this.notImplemented('getCalendarEvents');
  }
  getCurrentDate(_simulationId: string): IDateTimeDTO {
    return this.notImplemented('getCurrentDate');
  }
}