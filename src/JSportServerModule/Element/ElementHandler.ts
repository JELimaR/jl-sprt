import { IElementHandler } from "../../JSportModule";


export default class ElementHandler implements IElementHandler {
  /**
   * Patron Singleton
   */
  private static _instance: ElementHandler;
  private constructor() {}
  static get instance(): ElementHandler {
    if (!this._instance)
    this._instance = new ElementHandler();
    return this._instance;
  }
  /**
   * 
   */

  
  
}