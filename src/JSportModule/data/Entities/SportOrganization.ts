import { IJDateTimeCreator, JDate, JDateTime } from "../../../JCalendar";
import GeogEntity, { Town } from "./GeogEntity";

// export interface ISportOrganizationData {}

export interface ISportOrganizationCreator<G extends GeogEntity, M extends { id: string }> {
  id: string;
  areaAsosiated: G; // JContinent
  founders: M[];
  headquarters: Town; // Town
  fundationDay: number;
}

export default class SportOrganization<G extends GeogEntity, M extends { id: string }> {

  private _id: string;
  private _areaAsosiated: G;
  private _headquarters: Town;
  private _founderMembers: M[];
  private _members: Map<string, M> = new Map<string, M>();
  private _fundationDay: number;
  // private _calendar: JCalendar;

  constructor(isec: ISportOrganizationCreator<G, M>) {
    this._id = isec.id;
    this._areaAsosiated = isec.areaAsosiated;
    this._headquarters = isec.headquarters;
    this._founderMembers = isec.founders;
    this._founderMembers.forEach((m: M) => this._members.set(m.id, m));
    this._fundationDay = /*new JDateTime(*/isec.fundationDay/*)*/
    // this._calendar = new JCalendar(isec.dateTimeCreation);
  }

  get id(): string { return this._id }
  get areaAsosiated(): G { return this._areaAsosiated }
  get headquarters(): Town { return this._headquarters }
  get founderMembers(): M[] { return this._founderMembers }
  get members(): Map<string, M> { return this._members }
  // get calendar(): JDateTime { return this._dateTimeCreator }
  get foundationDate(): JDate { return new JDate(this._fundationDay); }

  addMember(m: M) {
    if (!!this._members.get(m.id)) throw new Error(`en add member`);
    this._members.set(m.id, m);
  }
}