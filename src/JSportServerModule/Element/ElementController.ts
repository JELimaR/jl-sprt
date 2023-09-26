import { IElementController } from "../../JSportDefModule";



export default class ElementController implements IElementController {
  /**
   * Patron Singleton
   */
  private static _instance: ElementController;
  private constructor() {}
  static get instance(): ElementController {
    if (!this._instance)
    this._instance = new ElementController();
    return this._instance;
  }
 
  
}