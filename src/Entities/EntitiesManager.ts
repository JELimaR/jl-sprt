import JInternationalEntity, { IJInternationalEntityCreator } from "./JInternationalEntity";


export default class EntiiesManager {
  private static _instance: EntiiesManager;
  private constructor() {}
  static get instance(): EntiiesManager {
    if (!this._instance)
      this._instance = new EntiiesManager();
    return this._instance;
  }

  /**
   * international entity
   */
  private _internationalEntity: JInternationalEntity | undefined;
  setInternationalEntity(iiec: IJInternationalEntityCreator) {
    this._internationalEntity = new JInternationalEntity(iiec);
  }
  getInternationalEntity(): JInternationalEntity | undefined { return this._internationalEntity }

  /**
   * confederations
   */
  private _confederations: any;


}