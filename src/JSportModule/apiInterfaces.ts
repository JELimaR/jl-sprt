import { Continent, Country, Federation, IContinentData, ICountryData, IFederationData, IInstitutionData, Institution, ITownData, Town } from "./data";
import { Confederation, IConfederationData } from "./data/Entities/Confederation";
import type { TypeCategory } from "jl-sprt-core";
import type { TSport } from "jl-sprt-match";

// El contrato del ElementController (operaciones + DTOs) vive en elementInterfaces.
import type { IElementController } from "./elementInterfaces";
export type { IElementController };

export interface IPaginationData {
  offset?: number;
  limit?: number;
}

/**
 * Vista plana de un equipo A NIVEL DE ENTIDAD (fuera de una simulación): identifica el
 * team de una institución en una categoría. Para datos de simulación (torneos, tabla,
 * partidos) está `ITeamDTO`/`getTeam` del ElementController.
 */
export interface ITeamEntityDTO {
  teamId: string;
  category: TypeCategory;
  name: string;
  sport: TSport;
  /** Colores de camiseta heredados de la institución (hex). */
  primaryColor: string;
  secondaryColor: string;
}
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
  getConfederationById(id: string): IConfederationData | null;
  removeConfederation(id: string): boolean;
  // federations
  createFederation(data: IFederationData): boolean;
  getFederations(pag: IPaginationData): IFederationData[];
  getFederationById(id: string): IFederationData | null;

  associateFederation(fid: string, cid: string): boolean;

  // institutions
  createInstitution(data: IInstitutionData): boolean;
  getInstitutions(pag: IPaginationData): IInstitutionData[];
  getInstitutionById(id: string): IInstitutionData | null;
  /** Equipos de una institución (uno por categoría existente). [] si no existe. */
  getInstitutionTeams(id: string): ITeamEntityDTO[];

  associateInstitution(iid: string, fid: string): boolean;
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