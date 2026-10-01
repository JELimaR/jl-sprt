import { ISportFactory, IEntityController, IElementController, ISportAPIController } from "./apiInterfaces";

export class SportAPIController implements ISportAPIController {
  private _factory: ISportFactory;
  constructor(factory: ISportFactory) {
    this._factory = factory;
  }
  getEntityController(): IEntityController {
    return this._factory.getEntityController()
  }
  getElementController(): IElementController {
    return this._factory.getElementController()
  }
}