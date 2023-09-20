import JFederation from "./Federation/JFederation";
import { JContinent } from "./JGeogEntity";
import JSportOrganization, { IJSportOrganizationCreator } from "./SportOrganization";

export interface IJConfederationCreator extends IJSportOrganizationCreator<JContinent, JFederation> {
  id: string;
}

interface IID {id: string}

export default class JConfederation extends JSportOrganization<JContinent, JFederation> implements IID {
  
  private _id: string;

  constructor(icc: IJConfederationCreator) {
    super(icc);
    this._id = icc.id;
  }

  get id(): string { return this._id; }
}