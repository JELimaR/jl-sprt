import { JDate } from "jl-calendar";
import {
  IEntityController,
  IContinentData, ICountryData, ITownData, Continent, Country, Town,
  IConfederationData, IConfederationCreator, Confederation,
  IFederationData, IFederationCreator, Federation,
  IInstitutionData, IInstitutionCreator, Institution,
  CupSystem, IPaginationData, ITeamEntityDTO,
} from "../../JSportModule";
import { TypeCategoryList, CATEGORIES, TypeCategory } from "jl-sprt-core";
import { LeagueSystem } from "../../JSportModule/data/Entities/LeagueSystem";
import { SportFactoryServer } from "../SportFactoryServer";
import { SportWorld } from "../../World/SportWorld";

/**
 * EntityController — API de ENTIDADES sobre el `SportWorld` del proceso.
 *
 * Opera sobre el mundo compartido (`SportFactoryServer.instance.world`), el mismo que
 * usa el ElementController. Antes el estado vivía en un `EntityHandler` singleton
 * aislado de las simulaciones; ahora las entidades y la simulación comparten mundo
 * (ver docs/plans/SPORT_WORLD.md).
 *
 * Convención de errores (SPORT_WORLD / API_CONTROLLERS §7):
 *  - COMANDOS (`create*`/`associate*`/`remove*`): LANZAN ante entrada inválida o
 *    referencia inexistente, con mensaje accionable.
 *  - QUERIES (`get*`): devuelven `null`/`[]` para "no encontrado" esperable.
 *
 * Recibe/devuelve DTOs planos (nombres abreviados existentes de entidad; su migración
 * a nombres legibles es un item aparte).
 */
export class EntityController implements IEntityController {
  private static _instance: EntityController;
  private constructor() { }
  static get instance(): EntityController {
    if (!this._instance)
      this._instance = new EntityController();
    return this._instance;
  }

  /** El mundo del proceso (estado compartido con el ElementController). */
  private get world(): SportWorld {
    return SportFactoryServer.instance.world;
  }

  // ==========================================================================
  // Geografía
  // ==========================================================================

  loadGeogExampleData(continents: IContinentData[], countries: ICountryData[], towns: ITownData[]): void {
    continents.forEach((d) => this.world.addContinent(new Continent(d)));
    countries.forEach((d) => this.world.addCountry(new Country(d)));
    towns.forEach((d) => this.world.addTown(new Town(d)));
  }

  // ==========================================================================
  // Confederaciones
  // ==========================================================================

  createConfederation(data: IConfederationData): boolean {
    const continent = this.requireContinent(data.aa, 'createConfederation');
    const town = this.requireTown(data.hq, 'createConfederation');

    const founders: Federation[] = [];
    const members: Map<string, Federation> = new Map();
    data.fs.forEach((fid) => {
      const fed = this.requireFederation(fid, 'createConfederation (founder)');
      founders.push(fed);
      members.set(fed.id, fed);
    });
    data.ms.forEach((fid) => {
      const fed = this.requireFederation(fid, 'createConfederation (member)');
      members.set(fed.id, fed);
    });

    const creator: IConfederationCreator = {
      id: data.i, name: data.n, shortName: data.sn,
      areaAsosiated: continent, headquarters: town,
      fundationDay: new JDate(data.fd),
      founderMembers: founders, members,
    };
    return this.world.addConfederation(new Confederation(creator));
  }

  getAllConfederations(): IConfederationData[] {
    return this.world.getConfederations().map((c) => c.getData());
  }

  getConfederationById(id: string): IConfederationData | null {
    const c = this.world.getConfederation(id);
    return c ? c.getData() : null;
  }

  removeConfederation(id: string): boolean {
    return this.world.removeConfederation(id);
  }

  // ==========================================================================
  // Federaciones
  // ==========================================================================

  createFederation(data: IFederationData): boolean {
    const country = this.requireCountry(data.aa, 'createFederation');
    const town = this.requireTown(data.hq, 'createFederation');

    const founders: Institution[] = [];
    const members: Map<string, Institution> = new Map();
    data.fs.forEach((iid) => {
      const inst = this.requireInstitution(iid, 'createFederation (founder)');
      founders.push(inst);
      members.set(inst.id, inst);
    });
    data.ms.forEach((iid) => {
      const inst = this.requireInstitution(iid, 'createFederation (member)');
      members.set(inst.id, inst);
    });

    const leagueSystem: TypeCategoryList<LeagueSystem> = {};
    const cupSystem: TypeCategoryList<CupSystem> = {};
    CATEGORIES.forEach((c: TypeCategory) => {
      const cupSystem_c = data.cSys[c];
      if (cupSystem_c) cupSystem[c] = new CupSystem(cupSystem_c);
      const leagueSystem_c = data.lSys[c];
      if (leagueSystem_c) leagueSystem[c] = new LeagueSystem(leagueSystem_c);
    });

    const creator: IFederationCreator = {
      id: data.i, name: data.n, shortName: data.sn,
      areaAsosiated: country, headquarters: town,
      fundationDay: new JDate(data.fd),
      founderMembers: founders, members, rankings: {},
      leagueSystem, cupSystem,
    };
    return this.world.addFederation(new Federation(creator));
  }

  getFederations(pag: IPaginationData): IFederationData[] {
    return paginate(this.world.getFederations(), pag).map((f) => f.getData());
  }

  getFederationById(id: string): IFederationData | null {
    const f = this.world.getFederation(id);
    return f ? f.getData() : null;
  }

  /**
   * Asocia una federación a una confederación. Valida que la federación pertenezca al
   * continente de la confederación (país.región === continente.id). Lanza si alguna no
   * existe; devuelve false si la validación geográfica no se cumple.
   */
  associateFederation(fid: string, cid: string): boolean {
    const federation = this.requireFederation(fid, 'associateFederation');
    const confederation = this.requireConfederation(cid, 'associateFederation');
    if (federation.areaAsosiated.info.r !== confederation.areaAsosiated.info.i) {
      return false;
    }
    confederation.addMember(federation);
    return true;
  }

  // ==========================================================================
  // Instituciones
  // ==========================================================================

  createInstitution(data: IInstitutionData): boolean {
    const town = this.requireTown(data.hq, 'createInstitution');
    const creator: IInstitutionCreator = {
      id: data.i, name: data.n, shortName: data.sn, abrevName: data.ab,
      headquarters: town, funtationDay: new JDate(data.fd), sport: data.sp,
      primaryColor: data.pc, secondaryColor: data.sc,
    };
    return this.world.addInstitution(new Institution(creator));
  }

  getInstitutions(pag: IPaginationData): IInstitutionData[] {
    return paginate(this.world.getInstitutions(), pag).map((i) => i.getData());
  }

  getInstitutionById(id: string): IInstitutionData | null {
    const i = this.world.getInstitution(id);
    return i ? i.getData() : null;
  }

  getInstitutionTeams(id: string): ITeamEntityDTO[] {
    const inst = this.world.getInstitution(id);
    if (!inst) return [];
    return inst.teams.map((team) => ({
      teamId: team.id,
      category: team.category,
      name: team.name,
      sport: inst.sport,
      primaryColor: inst.primaryColor,
      secondaryColor: inst.secondaryColor,
    }));
  }

  /**
   * Asocia una institución a una federación. Valida que la institución pertenezca al
   * país de la federación (town.country === federación.país). Lanza si alguna no
   * existe; devuelve false si la validación geográfica no se cumple.
   */
  associateInstitution(iid: string, fid: string): boolean {
    const institution = this.requireInstitution(iid, 'associateInstitution');
    const federation = this.requireFederation(fid, 'associateInstitution');
    if (institution.headquarters.info.c !== federation.areaAsosiated.id) {
      return false;
    }
    federation.addMember(institution);
    return true;
  }

  // ==========================================================================
  // Helpers de validación (lanzan con mensaje accionable)
  // ==========================================================================

  private requireContinent(id: string, ctx: string): Continent {
    const c = this.world.getContinent(id);
    if (!c) throw new Error(`${ctx}: no existe el continente "${id}". En EntityController.`);
    return c;
  }
  private requireCountry(id: string, ctx: string): Country {
    const c = this.world.getCountry(id);
    if (!c) throw new Error(`${ctx}: no existe el país "${id}". En EntityController.`);
    return c;
  }
  private requireTown(id: string, ctx: string): Town {
    const t = this.world.getTown(id);
    if (!t) throw new Error(`${ctx}: no existe la ciudad "${id}". En EntityController.`);
    return t;
  }
  private requireConfederation(id: string, ctx: string): Confederation {
    const c = this.world.getConfederation(id);
    if (!c) throw new Error(`${ctx}: no existe la confederación "${id}". En EntityController.`);
    return c;
  }
  private requireFederation(id: string, ctx: string): Federation {
    const f = this.world.getFederation(id);
    if (!f) throw new Error(`${ctx}: no existe la federación "${id}". En EntityController.`);
    return f;
  }
  private requireInstitution(id: string, ctx: string): Institution {
    const i = this.world.getInstitution(id);
    if (!i) throw new Error(`${ctx}: no existe la institución "${id}". En EntityController.`);
    return i;
  }
}

/** Aplica paginación `{ offset?, limit? }` a un listado. Sin paginación, devuelve todo. */
function paginate<T>(items: T[], pag: IPaginationData): T[] {
  const offset = pag?.offset ?? 0;
  const limit = pag?.limit;
  return limit === undefined ? items.slice(offset) : items.slice(offset, offset + limit);
}
