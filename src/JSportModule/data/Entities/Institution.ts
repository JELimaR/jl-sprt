import { Town } from "..";
import { JDate } from "../../../JCalendar";
import { TDC } from "../../patterns/templateDataCreator";
import Team from "../Team";
import { TypeCategory, TypeCategoryList } from "../types";

export interface IInstitutionData {//} extends ISportOrganizationData {
  i: string; // id
  n: string; // name
  sn: string; // shortName
  ab: string; // abrevName
  // aa: string; // areaAsociated
  // fs: string[]; // founderMembers
  // ms: string[]; // members
  hq: string; // headquarters
  fd: number; // funtationDay
}


export interface IInstitutionCreator {
  id: string;
  name: string; // name
  shortName: string; // shortName
  abrevName: string; // abrevName
  // aa: string; // areaAsociated
  // fs: string[]; // founderMembers
  // ms: string[]; // members
  headquarters: Town; // headquarters
  funtationDay: JDate; // funtationDay
}

export class Institution extends TDC<IInstitutionData, IInstitutionCreator>{
    // _installations: Installation[] = [];

  _teams: TypeCategoryList<Team> = {};

  constructor(iic: IInstitutionCreator) {
    super(iic)
  }

  get id() { return this.info.id }

  createTeam(category: TypeCategory) {
    if (this._teams[category])
      throw new Error(`la inst ${this.info.id} ya cuenta con un team en la categoria: ${category}`);

    this._teams[category] = new Team({
      category: category,
      entity: this,
      matches: []
    });
  }

  getTeam(category: TypeCategory): Team | undefined {
    return this._teams[category]
  }

  getData(): IInstitutionData {
    return {
      i: this.info.id, n: this.info.name, sn: this.info.shortName, ab: this.info.abrevName,
      hq: this.info.headquarters.id,
      fd: this.info.funtationDay.getDate().dayAbsolute
    }
  }


}