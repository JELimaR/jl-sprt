import { IEntityHandler } from "../../JSportModule";
import { Institution } from "../../JSportModule/data/Entities/Institution";
import { Federation } from "../../JSportModule/data/Entities/Federation";
import { Country, Continent, Town } from "../../JSportModule/data/Entities/GeogEntity";
import { Confederation, IConfederationData } from "../../JSportModule/data/Entities/Confederation";


export default class EntityHandler implements IEntityHandler {
  /**
   * Patron Singleton
   */
  private static _instance: EntityHandler;
  private constructor() { }  
  static get instance(): EntityHandler {
    if (!this._instance)
    this._instance = new EntityHandler();
    return this._instance;
  }

  /**
   * GEOGs Hay que borrar ESTO!!!!!!
   */
  _continents: Continent[] = []
  getContinents(): Continent[] {
    return this._continents;
  }
  _countries: Country[] = []
  getCountries(): Country[] {
    return this._countries;
  }
  _towns: Town[] = []
  getTowns(): Town[] {
    return this._towns;
  }
  /**
   * CONFEDERATIONS
   */
  private _confederations: Map<string, Confederation> = new Map<string, Confederation>();
  addConfederation(con: Confederation): boolean {
    const cid = con.id;
    if (!!this._confederations.get(cid))
      return false;
    else {
      this._confederations.set(cid, con)
      return true;
    }
  }
  getAllConfederations(): Confederation[] {
    const out: Confederation[] = []
    this._confederations.forEach(c => out.push(c))
    return out;
  }
  getConfederationById(id: string): Confederation {
    return this._confederations.get(id)! // OJO
  }
  removeConfederation(id: string): boolean {
    throw new Error("Method not implemented.");
  }
  /**
   * FEDERATIONS
   */
  private _federations: Map<string, Federation> = new Map<string, Federation>();
  addFederation(federation: Federation): boolean {
    const fid = federation.id;
    if (!!this._federations.get(fid))
      return false;
    else {
      this._federations.set(fid, federation)
      return true;
    }
  }
  getAllFederations(): Federation[] {
    const out: Federation[] = []
    this._federations.forEach(f => out.push(f))
    return out;
  }
  getFederationById(id: string): Federation {
    return this._federations.get(id)! // OJO
  }
  removeFederation(id: string): boolean {
    throw new Error("Method not implemented.");
  }

  /**
   * INSTITUTIONS
   */
  private _institutions: Map<string, Institution> = new Map<string, Institution>();
  addInstitution(inst: Institution): boolean {
    const iid = inst.id;
    if (!!this._institutions.get(iid)) {
      return false;
    } else {
      this._institutions.set(inst.id, inst)
      return true;
    }
  }
  getAllInstitutions(): Institution[] {
    const out: Institution[] = []
    this._institutions.forEach(i => out.push(i))
    return out;
  }
  getInstitutionById(id: string): Institution {
    return this._institutions.get(id)! // OJO
  }
  removeInstitution(id: string): boolean {
    throw new Error("Method not implemented.");
  }

}