import { TDC } from "../../patterns/templateDataCreator";

export interface IGeogEntityData {
  i: string;
  n: string;
  p: number;
  a: number;
}

export interface IGeogEntityCreator {
  id: string;
  name: string;
  pop: number;
  area: number;
}

export abstract class GeogEntity<D extends IGeogEntityData/*, C extends IGeogEntityCreator*/> extends TDC<D, D> {
  
  constructor(c: D) {
    super(c)
  }
  get id(): string { return this.info.i }
}

export class World extends GeogEntity<IGeogEntityData> {
  getData(): IGeogEntityData {
    throw new Error("Method not implemented.");
  }
}

export interface IContinentData extends IGeogEntityData {}
export class Continent extends GeogEntity<IContinentData> {
  getData(): IContinentData {
    throw new Error("Method not implemented.");
  }
}

export interface ICountryData extends IGeogEntityData {r: string}
export class Country extends GeogEntity<ICountryData> {
  getData(): ICountryData {
    throw new Error("Method not implemented.");
  }
}

export interface ISData extends IGeogEntityData {}
export class S extends GeogEntity<ISData> {
  getData(): ISData {
    throw new Error("Method not implemented.");
  }
} 

export interface IPData extends IGeogEntityData {}
export class P extends GeogEntity<IPData> {
  getData(): IPData {
    throw new Error("Method not implemented.");
  }
} 

export interface IMData extends IGeogEntityData {}
export class M extends GeogEntity<IMData> {
  getData(): IMData {
    throw new Error("Method not implemented.");
  }
} 

export interface ITownData extends IGeogEntityData {c: string}
export class Town extends GeogEntity<ITownData> {
  getData(): ITownData {
    throw new Error("Method not implemented.");
  }
} // ?