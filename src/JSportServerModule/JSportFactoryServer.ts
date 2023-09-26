import { IElementController, IEntityController, ISportFactory } from "../JSportDefModule";
import ElementController from "./Element/ElementController";
import EntityController from "./Entity/EntityController";

export default class JSportFactoryServer implements ISportFactory {
  /**
   * Patron Singleton
   */
  private static _instance: JSportFactoryServer;
  private constructor() {}
  static get instance(): JSportFactoryServer {
    if (!this._instance)
    this._instance = new JSportFactoryServer();
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