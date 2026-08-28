import { IElementController, IEntityController, ISportFactory } from "../JSportModule";
import ElementController from "./Element/ElementController";
import EntityController from "./Entity/EntityController";

export default class SportFactoryServer implements ISportFactory {
  /**
   * Patron Singleton
   */
  private static _instance: SportFactoryServer;
  private constructor() {}
  static get instance(): SportFactoryServer {
    if (!this._instance)
    this._instance = new SportFactoryServer();
    return this._instance;
  }
  /**
   * 
   */
  getEntityController(): IEntityController {
    return EntityController.instance;
  }
  getElementController(): IElementController {
    return ElementController.instance;
  }
  
}