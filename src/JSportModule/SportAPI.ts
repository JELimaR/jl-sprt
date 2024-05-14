import ElementController from "../JSportServerModule/Element/ElementController";
import EntityController from "../JSportServerModule/Entity/EntityController";
import { ISportFactory, IPaginationData, ISportAPIController } from "./apiInterfaces";

export class SportAPIController implements ISportAPIController {
  private _factory: ISportFactory;
  constructor(factory: ISportFactory) {
    this._factory = factory;
  }
  getEntityController(): EntityController {
    return this._factory.getEntityController()
  }
  getElementController(): ElementController {
    return this._factory.getElementController()
  }
}