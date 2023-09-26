import { ISportFactory, IPaginationData, ISportAPIController } from "./apiInterfaces";
import { IConfederationData, IFederationData } from "./data/entities";

export class SportAPIController implements ISportAPIController {
  private _factory: ISportFactory;
  constructor(factory: ISportFactory) {
    this._factory = factory;
  }
  getAllConfederations(): IConfederationData[] {
    return this._factory.getEntityController().getAllConfederations();
  }
  createFederation(data: IFederationData): boolean {
    return this._factory.getEntityController().createFederation(data);
  }
  getAllFederations(pag: IPaginationData): IFederationData[] {
    return this._factory.getEntityController().getAllFederations(pag);
  }
  getFederationById(id: string): IFederationData {
    return this._factory.getEntityController().getFederationById(id);
  }

  
}