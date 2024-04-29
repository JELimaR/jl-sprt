import Team from "../Team";
import { TypeCategory, TypeCategoryList } from "../types";

export interface IInstitutionCreator {
  id: string;
}

export class Institution {
  _id: string;
  // _installations: Installation[] = [];

  _teams: TypeCategoryList<Team> = {};

  constructor(iic: IInstitutionCreator) {
    this._id = iic.id;
  }

  get id() { return this._id }

  createTeam(category: TypeCategory) {
    if (this._teams[category])
      throw new Error(`la inst ${this._id} ya cuenta con un team en la categoria: ${category}`);

    this._teams[category] = new Team({
      category: category,
      entity: this,
      matches: []
    });
  }

  getTeam(category: TypeCategory): Team | undefined {
    return this._teams[category]
  }
}