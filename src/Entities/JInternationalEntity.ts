import JFederation from "./Federation/JFederation";
import JConfederation from "./JConfederation";
import { JWorld } from "./JGeogEntity";
import JSportOrganization, { IJSportOrganizationCreator } from "./SportOrganization";

export interface IJInternationalEntityCreator extends IJSportOrganizationCreator<JWorld, JFederation> {

}

export default class JInternationalEntity extends JSportOrganization<JWorld, JFederation> { // conf o fed?

  private _confederations: Map<string, JConfederation> = new Map<string, JConfederation>(); // o map

  constructor(iiec: IJInternationalEntityCreator) {
    super(iiec);
  }

  get confederations(): Map<string, JConfederation> { return this._confederations }
  addConfederation(conf: JConfederation): void {
    if (!!this._confederations.get(conf.id)) throw new Error(`en add confederation de JInternationalEntity`);
    this._confederations.set(conf.id, conf);
  }

}