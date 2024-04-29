
export interface IGeogEntityData {
  id: string;
}

export default class GeogEntity {
  private _id: string;
  constructor(data: IGeogEntityData) {
    this._id = data.id;
  }
  get id(): string { return this._id }
}

export class World extends GeogEntity {}

export class Continent extends GeogEntity {}

export class Country extends GeogEntity {}

export class Town extends GeogEntity {} // ?