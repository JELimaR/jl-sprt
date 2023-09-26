import { IEntityHandler } from "../../JSportDefModule";
import { IFederationData } from "../../JSportDefModule/data/entities";


export default class EntityHandler implements IEntityHandler {
  /**
   * Patron Singleton
   */
  private static _instance: EntityHandler;
  private constructor() {}
  static get instance(): EntityHandler {
    if (!this._instance)
    this._instance = new EntityHandler();
    return this._instance;
  }
  /**
   * FEDERATIONS
   */

  addFederation(data: IFederationData): boolean {
    throw new Error("Method not implemented.");
  }
  getAllFederations(): IFederationData[] {
    throw new Error("Method not implemented.");
  }
  getFederationById(id: string): IFederationData {
    throw new Error("Method not implemented.");
  }
  removeFederation(id: string): boolean {
    throw new Error("Method not implemented.");
  }
  
}