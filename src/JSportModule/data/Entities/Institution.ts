import { Town } from "..";
import { JDate } from "jl-calendar";
import { TDC } from "../../patterns/templateDataCreator";
import { AnyTeam, TypeCategory, TypeCategoryList } from "jl-sprt-core";
import { ProfilesFactory, TSport } from "jl-sprt-match";

export interface IInstitutionData {
  i: string; // id
  n: string; // name
  sn: string; // shortName
  ab: string; // abrevName
  hq: string; // headquarters
  fd: number; // funtationDay
  sp: TSport; // sport
}


export interface IInstitutionCreator {
  id: string;
  name: string; // name
  shortName: string; // shortName
  abrevName: string; // abrevName
  headquarters: Town; // headquarters
  funtationDay: JDate; // funtationDay
  sport: TSport; // sport
}

export class Institution extends TDC<IInstitutionData, IInstitutionCreator> {
  _teams: TypeCategoryList<AnyTeam> = {};

  constructor(iic: IInstitutionCreator) {
    super(iic)
  }

  get id() { return this.info.id }
  get name(): string { return this.info.name }
  get shortName(): string { return this.info.shortName }
  get abrevName(): string { return this.info.abrevName }
  get sport(): TSport { return this.info.sport; }

  createTeam(category: TypeCategory) {
    if (this._teams[category])
      throw new Error(`la inst ${this.info.id} ya cuenta con un team en la categoria: ${category}`);

    const profile = ProfilesFactory.getProfile(this.sport);
    this._teams[category] = profile.createTeam({
      id: `${category}_${this.id}`,
      category: category,
      owner: this,
    });
  }

  getTeam(category: TypeCategory): AnyTeam | undefined {
    return this._teams[category]
  }

  getData(): IInstitutionData {
    return {
      i: this.info.id, n: this.info.name, sn: this.info.shortName, ab: this.info.abrevName,
      hq: this.info.headquarters.id,
      fd: this.info.funtationDay.getDate().dayAbsolute,
      sp: this.sport,
    }
  }
}
