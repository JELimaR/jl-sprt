import { IEntityController, IPaginationData } from "../../JSportModule";
import { IConfederationData, IFederationData } from "../../JSportModule/data/entities";
import EntityHandler from "./EntityHandler";



export default class EntityController implements IEntityController {
  /**
   * Patron Singleton
   */
  private static _instance: EntityController;
  private constructor() {}
  static get instance(): EntityController {
    if (!this._instance)
    this._instance = new EntityController();
    return this._instance;
  }
  /**
   * CONFEDERATIONS
   */
  getAllConfederations(): IConfederationData[] {
    const handler = EntityHandler.instance;
    return handler.getAllConfederations();
  }
  /**
   * FEDERATIONS
   */
  createFederation(data: IFederationData): boolean {
    throw new Error("Method not implemented.");
  }
  getFederations(pag: IPaginationData): IFederationData[] {
    throw new Error("Method not implemented.");
  }
  getFederationById(id: string): IFederationData {
    throw new Error("Method not implemented.");
  }
  
}