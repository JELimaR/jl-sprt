import { IConfederationData, IFederationData } from "./data";

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
  // confederations
  getAllConfederations(): IConfederationData[];
  // federations
  createFederation(data: IFederationData): boolean;
  getFederations(pag: IPaginationData): IFederationData[];
  getFederationById(id: string): IFederationData;
}

export interface IElementController {

}

/**
 * Handlers
 */
export interface IEntityHandler {
   // confederations
  getAllConfederations(): IConfederationData[];
  getConfederationById(): IConfederationData;
  removeConfederation(id: string): boolean;
  // federations
  addFederation(data: IFederationData): boolean;
  getAllFederations(): IFederationData[];
  getFederationById(id: string): IFederationData;
  removeFederation(id: string): boolean;

}

export interface IElementHandler {

}