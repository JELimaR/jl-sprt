import { IEntityHandler } from "../../JSportModule";
import { IConfederationData, IFederationData } from "../../JSportModule/data/entities";


export default class EntityHandler implements IEntityHandler {
  /**
   * Patron Singleton
   */
  private static _instance: EntityHandler;
  private constructor() { }
  static get instance(): EntityHandler {
    if (!this._instance)
    this._instance = new EntityHandler();
    return this._instance;
  }
  /**
   * CONFEDERATIONS
   */
  getAllConfederations(): IConfederationData[] {
    return [];
  }
  getConfederationById(): IConfederationData {
    throw new Error("Method not implemented.");
  }
  removeConfederation(id: string): boolean {
    throw new Error("Method not implemented.");
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