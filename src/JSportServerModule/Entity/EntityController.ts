import { IEntityController, IPaginationData } from "../../JSportDefModule";
import { IConfederationData, IFederationData } from "../../JSportDefModule/data/entities";



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
    throw new Error("Method not implemented.");
  }
  /**
   * FEDERATIONS
   */
  createFederation(data: IFederationData): boolean {
    throw new Error("Method not implemented.");
  }
  getAllFederations(pag: IPaginationData): IFederationData[] {
    throw new Error("Method not implemented.");
  }
  getFederationById(id: string): IFederationData {
    throw new Error("Method not implemented.");
  }
  
}