import { JDate } from "../Calendar/DateTime/JDate";
import { IJDateTimeCreator } from "../Calendar/DateTime/JDateTime";
import JCalendar from "../Calendar/JCalendar";
import JGeogEntity, { JTown } from "./JGeogEntity";

export interface IJSportOrganizationCreator<G extends JGeogEntity, M extends { id: string }> {
  areaAsosiated: G; // JContinent
  founders: M[];
  headquarters: JTown; // JTown
  dateTimeCreation: IJDateTimeCreator;
}

export default class JSportOrganization<G, M extends { id: string }> {

  private _areaAsosiated: G;
  private _headquarters: JTown;
  private _founderMembers: M[];
  private _members: Map<string, M> = new Map<string, M>();
  private _calendar: JCalendar;

  constructor(isec: IJSportOrganizationCreator<G, M>) {
    this._areaAsosiated = isec.areaAsosiated;
    this._headquarters = isec.headquarters;
    this._founderMembers = isec.founders;
    this._founderMembers.forEach((m: M) => this._members.set(m.id, m));
    this._calendar = new JCalendar(isec.dateTimeCreation);
  }

  get areaAsosiated(): G { return this._areaAsosiated }
  get headquarters(): JTown { return this._headquarters }
  get founderMembers(): M[] { return this._founderMembers }
  get members(): Map<string, M> { return this._members }
  get calendar(): JCalendar { return this._calendar }
  get foundationDate(): JDate { return this._calendar.init.date; }

  addMember(m: M) {
    if (!!this._members.get(m.id)) throw new Error(`en add member`);
    this._members.set(m.id, m);
  }
}