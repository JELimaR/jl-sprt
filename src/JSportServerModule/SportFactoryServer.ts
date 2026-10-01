import { IElementController, IEntityController, ISportFactory } from "../JSportModule";
import { ElementController } from "./Element/ElementController";
import { EntityController } from "./Entity/EntityController";
import { SportWorld } from "../World/SportWorld";

/** Temporada por defecto del mundo del proceso (hasta que el consumidor elija otra). */
const DEFAULT_WORLD_SEASON = 1986;

export class SportFactoryServer implements ISportFactory {
  /**
   * Patron Singleton
   */
  private static _instance: SportFactoryServer;
  private constructor() { }
  static get instance(): SportFactoryServer {
    if (!this._instance)
      this._instance = new SportFactoryServer();
    return this._instance;
  }

  /**
   * El `SportWorld` del proceso: estado del mundo (entidades + calendario + rankings)
   * COMPARTIDO por EntityController y ElementController. Es el punto que conecta las
   * entidades con la simulación (antes vivían aisladas en el EntityHandler singleton).
   * Ver docs/plans/SPORT_WORLD.md.
   */
  private _world: SportWorld = SportWorld.createFromYear(DEFAULT_WORLD_SEASON);
  get world(): SportWorld { return this._world; }

  /**
   * Reemplaza el mundo del proceso por uno nuevo y vacío. Pensado para TESTS y para
   * reiniciar la simulación. Como los controllers leen `world` de forma perezosa,
   * tras el reset operan sobre el mundo nuevo. (Las sesiones del ElementHandler que
   * referenciaban el mundo anterior quedan huérfanas; conviene limpiarlas aparte.)
   */
  resetWorld(season: number = DEFAULT_WORLD_SEASON): SportWorld {
    this._world = SportWorld.createFromYear(season);
    return this._world;
  }

  getEntityController(): IEntityController {
    return EntityController.instance;
  }
  getElementController(): IElementController {
    return ElementController.instance;
  }

}