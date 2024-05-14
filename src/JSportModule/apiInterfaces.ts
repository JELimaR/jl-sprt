import { Continent, Country, Federation, IContinentData, ICountryData, IFederationData, IInstitutionData, Institution, ITownData, Town } from "./data";
import { Confederation, IConfederationData } from "./data/Entities/Confederation";

export interface IPaginationData { }
export interface ISportAPIController { 
  
}
/**
 * Factory
 */
export interface ISportFactory {
  getEntityController(): IEntityController;
  getElementController(): IElementController;
}
/**
 * Controllers
 */
export interface IEntityController {
  loadGeogExampleData(continents: IContinentData[], countries: ICountryData[], towns: ITownData[]): void;
  // 
  createConfederation(data: IConfederationData): boolean;
  getAllConfederations(): IConfederationData[];
  getConfederationById(id: string): IConfederationData;
  removeConfederation(id: string): boolean;
  // federations
  createFederation(data: IFederationData): boolean;
  getFederations(pag: IPaginationData): IFederationData[];
  getFederationById(id: string): IFederationData;

  associateFederation(fid: string, cid: string): boolean;

  // institutions
  createInstitution(data: IInstitutionData): boolean;
  getInstitutions(pag: IPaginationData): IInstitutionData[];
  getInstitutionById(id: string): IInstitutionData

  associateInstitution(iid: string, fid: string): boolean;
}

export interface IElementController {

}

/**
 * Handlers
 */
export interface IEntityHandler {
  // geog
  getContinents(): Continent[];
  getCountries(): Country[];
  getTowns(): Town[]
  // confederations
  addConfederation(con: Confederation): boolean;
  getAllConfederations(): Confederation[];
  getConfederationById(id: string): Confederation;
  removeConfederation(id: string): boolean;
  // federations
  addFederation(fed: Federation): boolean;
  getAllFederations(): Federation[];
  getFederationById(id: string): Federation;
  removeFederation(id: string): boolean;
  // institutions
  addInstitution(inst: Institution): boolean;
  getAllInstitutions(): Institution[];
  getInstitutionById(id: string): Institution;
  removeInstitution(id: string): boolean;
}

export interface IElementHandler {

}