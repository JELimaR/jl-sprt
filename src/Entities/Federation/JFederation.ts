import Team from "../../Tournament/Team";
import { TypeCategoryList, TypeJCategory } from "../../Tournament/types";
import { IJDateTimeCreator, JDateTime } from "../../JCalendar/DateTime/JDateTime";
import JInstitution from "../JInstitution";
import LeagueSystem, { IJCupSystemCreator, ILeagueSystemCreator, JCupSystem } from "../LeagueSystem";
import { DAYSPERYEAR, TypeDayOfYear } from "../../JCalendar/DateTime/types";
import JEventChangeFederationReadingConfig from "./JEventChangeFederationReadingConfig";
import JSportOrganization, { IJSportOrganizationCreator } from "../SportOrganization";
import { JCountry } from "../JGeogEntity";

export type TypeFederationReadingConfig = 
 | {
   type: 'c',
   config: IJCupSystemCreator
 }
 | {
  type: 'l',
  config: ILeagueSystemCreator
}

export interface IJFederationCreator extends IJSportOrganizationCreator<JCountry, JInstitution> {
  id: string;
  // country: JCountry; // JCountry
  // founders: JInstitution[];
  // headquarters: any; // JTown
  // dateTimeCreator: IJDateTimeCreator;
}

export default class JFederation extends JSportOrganization<JCountry, JInstitution> {
  private _id: string;

  /**
   * comps
   */
  // config
  private _leagueSystemConfig: TypeCategoryList<ILeagueSystemCreator> = {};
  private _cupSystemConfg: TypeCategoryList<IJCupSystemCreator> = {};
  // tournaments
  private _currentLeagueSystem: TypeCategoryList<LeagueSystem> = {};
  private _currenCupSystem: TypeCategoryList<JCupSystem> = {};
  private _historicLeagueSystem: TypeCategoryList<LeagueSystem>[] = [];
  private _historicCupSystem: TypeCategoryList<JCupSystem>[] = [];

  //
  private _teams: TypeCategoryList<Team> = {};
  
  // _calendar: JCalendar;
  
  constructor(ifc: IJFederationCreator) {
    super(ifc)
    this._id = ifc.id;
  }
  get id(): string {return this._id}

  createTeam(category: TypeJCategory) {
    if (!this._teams[category])
      throw new Error(`la inst ${this._id} ya cuenta con un team en la categoria: ${category}`);
      
    let tid: string = `${this._id}-${category}`
    this._teams[category] = new Team(tid);
  }
  getFederationTeamPerCategory(category: TypeJCategory): Team | undefined { return this._teams[category] }

  getInstitutionTeamsPerCategory(cat: TypeJCategory): Team[] {
    let out: Team[] = [];
    this.members.forEach((inst: JInstitution) => {
      const team: Team | undefined = inst.getInstitutionPerCategory(cat);
      if (team) out.push(team);
    })
    return out;
  }

  setleagueSystem(ilsc: ILeagueSystemCreator ): void { 
    this._leagueSystemConfig[ilsc.category] = ilsc;
  }
  setCupSystem(icsc: IJCupSystemCreator ): void { 
    this._cupSystemConfg[icsc.category] = icsc;
  }

  changeLeagueSystemConfig(ilsc: ILeagueSystemCreator): void {
    const currentlsConfig: ILeagueSystemCreator | undefined = this._leagueSystemConfig[ilsc.category];
    if (!currentlsConfig) {
      this.setleagueSystem(ilsc);
    } else {
      /**
       * crear un evento para el ultimo día de la season siguiente para cambiar el ls o de la misma season segun:
       * cambio de formato y no de prom y rel number asi como del participants number
       * */ 
      let forNextSeason: boolean = true;
      if (currentlsConfig.divisions.length === ilsc.divisions.length) {
        console.log('mismo tamaño');
      }
      const year = this.calendar.now.getDateTime().date.year + (forNextSeason ? 0 : 1);// 0 o 1
      this.calendar.addEvent( new JEventChangeFederationReadingConfig({
        dateTime: JDateTime.createFromDayOfYearAndYear(DAYSPERYEAR as TypeDayOfYear, year).getIJDateTimeCreator(),
        calendar: this.calendar,
        fed: this,
        config: {type: 'l', config: ilsc},
      }))
    }
  }

  changeCupSystemConfig(icsc: IJCupSystemCreator): void {

    const year = this.calendar.now.getDateTime().date.year;
    this.calendar.addEvent( new JEventChangeFederationReadingConfig({
      dateTime: JDateTime.createFromDayOfYearAndYear(DAYSPERYEAR as TypeDayOfYear, year).getIJDateTimeCreator(),
      calendar: this.calendar,
      fed: this,
      config: {type: 'c', config: icsc},
    }))

  }

}