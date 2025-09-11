
import EntityHandler from "./EntityHandler";
import { JDate } from "../../JCalendar";
import { IEntityController, IContinentData, ICountryData, ITownData, Continent, Country, Town, IConfederationData, Federation, IConfederationCreator, Confederation, IFederationData, Institution, TypeCategoryList, CupSystem, CATEGORIES, TypeCategory, IFederationCreator, IPaginationData, IInstitutionData, IInstitutionCreator } from "../../JSportModule";
import LeagueSystem from "../../JSportModule/data/Entities/LeagueSystem";

export default class EntityController implements IEntityController {
  /**
   * Patron Singleton
   */
  private static _instance: EntityController;
  private constructor() { }
  static get instance(): EntityController {
    if (!this._instance)
      this._instance = new EntityController();
    return this._instance;
  }
  loadGeogExampleData(continents: IContinentData[], countries: ICountryData[], towns: ITownData[]) {
    const eh = EntityHandler.instance;
    eh.getContinents().push(...continents.map(icd => new Continent(icd)))
    eh.getCountries().push(...countries.map(icd => new Country(icd)))
    eh.getTowns().push(...towns.map(itd => new Town(itd)))
  }
  /**
   * CONFEDERATIONS
   */
  createConfederation(data: IConfederationData): boolean {
    const eh = EntityHandler.instance;
    // obtengo datos de continent y town
    const continent = eh.getContinents().find(e => e.id == data.aa) as Continent;
    const town = eh.getTowns().find(e => e.id == data.hq) as Town;
    /// founders y members
    const founders: Federation[] = []
    const members: Map<string, Federation> = new Map<string, Federation>()
    data.fs.forEach((iid: string) => {
      const fed = eh.getFederationById(iid) // si no lo encuentra?
      founders.push(fed)
      members.set(fed.id, fed)
    })
    data.ms.forEach((iid: string) => {
      const fed = eh.getFederationById(iid) // si no lo encuentra?
      members.set(fed.id, fed)
    })
    const creator: IConfederationCreator = {
      id: data.i, name: data.n, shortName: data.sn, areaAsosiated: continent,
      headquarters: town, fundationDay: new JDate(data.fd),
      founderMembers: founders, members: members,
    }
    return eh.addConfederation(new Confederation(creator))
  }
  getConfederationById(id: string): IConfederationData {
    throw new Error("Method not implemented.");
  }
  removeConfederation(id: string): boolean {
    throw new Error("Method not implemented.");
  }
  getAllConfederations(): IConfederationData[] {
    const handler = EntityHandler.instance;
    return handler.getAllConfederations().map(c => c.getData());
  }
  /**
   * FEDERATIONS
   */
  createFederation(data: IFederationData): boolean {
    const eh = EntityHandler.instance;
    // obtengo datos de country y town
    const country = eh.getCountries().find(e => e.id == data.aa) as Country;
    const town = eh.getTowns().find(e => e.id == data.hq) as Town;
    /// founders y members
    const founders: Institution[] = []
    const members: Map<string, Institution> = new Map<string, Institution>()
    data.fs.forEach((iid: string) => {
      const inst = eh.getInstitutionById(iid) // si no lo encuentra?
      founders.push(inst)
      members.set(inst.id, inst)
    })
    data.ms.forEach((iid: string) => {
      const inst = eh.getInstitutionById(iid) // si no lo encuentra?
      members.set(inst.id, inst)
    })
    // leagueSystem y cupsystem
    let leagueSystem: TypeCategoryList<LeagueSystem> = {}
    let cupSystem: TypeCategoryList<CupSystem> = {}
    CATEGORIES.forEach((c: TypeCategory) => {
      const cupSystem_c = data.cSys[c]
      if (cupSystem_c)
        cupSystem[c] = new CupSystem(cupSystem_c)
      const leagueSystem_c = data.lSys[c];
      if (leagueSystem_c)
        leagueSystem[c] = new LeagueSystem(leagueSystem_c);
    })
    // genero el creator
    const creator: IFederationCreator = {
      id: data.i, name: data.n, shortName: data.sn, areaAsosiated: country,
      headquarters: town, fundationDay: new JDate(data.fd),
      founderMembers: founders, members: members, rankings: {},
      leagueSystem: leagueSystem, cupSystem: cupSystem
    }
    return eh.addFederation(new Federation(creator));
  }
  getFederations(pag: IPaginationData): IFederationData[] {
    const eh = EntityHandler.instance;
    return eh.getAllFederations().map(f => f.getData())
  }
  getFederationById(id: string): IFederationData {
    const eh = EntityHandler.instance;
    const federation = eh.getFederationById(id); // si no lo encuentra?
    return federation.getData()
  }

  associateFederation(fid: string, cid: string): boolean {
    const eh = EntityHandler.instance;
    const federation = eh.getFederationById(fid)
    const confederation = eh.getConfederationById(cid);
    if (federation.areaAsosiated.info.r !== confederation.areaAsosiated.info.i) {
      return false;
    } else {
      confederation.addMember(federation);
      return true;
    }
  }
  /**
   * INSTITUTIONS
   */
  createInstitution(data: IInstitutionData): boolean {
    const eh = EntityHandler.instance;

    // obtengo datos de country y town
    // const country = eh.getCountries().find(e => e.id == data.aa) as Country;
    const town = eh.getTowns().find(e => e.id == data.hq) as Town;
    const creator: IInstitutionCreator = {
      id: data.i, name: data.n, shortName: data.sn, abrevName: data.ab,
      headquarters: town,
      funtationDay: new JDate(data.fd)
    }
    return eh.addInstitution(new Institution(creator))
  }
  getInstitutions(pag: IPaginationData): IInstitutionData[] {
    const eh = EntityHandler.instance;
    return eh.getAllInstitutions().map(i => i.getData())
  }
  getInstitutionById(id: string): IInstitutionData {
    throw new Error("Method not implemented.");
  }

  associateInstitution(iid: string, fid: string): boolean {
    throw new Error("Method not implemented.");
  }
}