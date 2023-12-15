import Team from "../JSportModule/data/Team";
import { TypeCategoryList, TypeJCategory } from "../Tournament/types";

export class JInstallation {

}

export class JStadium extends JInstallation {

}


export interface IJInstitutionCreator {
  id: string;
}


export default class JInstitution {
  _id: string;
  _installations: JInstallation[] = [];

  _teams: TypeCategoryList<Team> = {};

  constructor(iic: IJInstitutionCreator) {
    this._id = iic.id;
  }

  get id() { return this._id }

  createTeam(category: TypeJCategory) {
    if (!this._teams[category])
      throw new Error(`la inst ${this._id} ya cuenta con un team en la categoria: ${category}`);

    let tid: string = `${this._id}-${category}`
    this._teams[category] = new Team(tid);
  }
  getInstitutionPerCategory(category: TypeJCategory): Team | undefined { return this._teams[category] }

}