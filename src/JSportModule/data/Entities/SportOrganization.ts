import { IJDateTimeCreator, JDate, JDateTime } from "../../../JCalendar";
import { TDC } from "../../patterns/templateDataCreator";
import {GeogEntity, IGeogEntityData, Town } from "./GeogEntity";

export interface ISportOrganizationData {
  i: string; // id
  n: string; // name
  sn: string; // shortName
  aa: string; // areaAsociated
  fs: string[]; // founderMembers
  ms: string[]; // members
  hq: string; // headquarters
  fd: number; // funtationDay
}

export interface ISportOrganizationCreator<G extends GeogEntity<IGeogEntityData>, M extends { id: string }> {
  id: string;
  name: string;
  shortName: string;
  areaAsosiated: G; // JContinent
  headquarters: Town; // Town
  fundationDay: JDate;
  founderMembers: M[];
  members: Map<string, M>;
}

export default abstract class SportOrganization<
  G extends GeogEntity<IGeogEntityData>, M extends { id: string },
  D extends ISportOrganizationData, C extends ISportOrganizationCreator<G, M>
  > extends TDC<D, C> {

  // private _id: string;
  // private _name: string;
  // private _shortName: string;
  // private _areaAsosiated: G;
  // private _headquarters: Town;
  // private _founderMembers: M[];
  // private _members: Map<string, M> = new Map<string, M>();
  // private _fundationDay: JDate;
  // private _calendar: JCalendar;

  constructor(isec: C) {
    super(isec)
    // this._id = isec.id;
    // this._name = isec.name;
    // this._shortName = isec.shortName;
    // this._areaAsosiated = isec.areaAsosiated;
    // this._headquarters = isec.headquarters;
    // this._founderMembers = isec.founderMembers;
    this.info.founderMembers.forEach((m: M) => this.info.members.set(m.id, m));
    // this._fundationDay = /*new JDateTime(*/isec.fundationDay/*)*/
    // // this._calendar = new JCalendar(isec.dateTimeCreation);
    // isec.members.forEach((m: M) => {
    //   this.info.members.set(m.id, m)
    // })
  }

  get id(): string { return this.info.id }
  get name(): string { return this.info.name }
  get shortName(): string { return this.info.shortName }
  get areaAsosiated(): G { return this.info.areaAsosiated }
  get headquarters(): Town { return this.info.headquarters }
  get founderMembers(): M[] { return this.info.founderMembers }
  get members(): Map<string, M> { return this.info.members }
  // get calendar(): JDateTime { return this._dateTimeCreator }
  get foundationDate(): JDate { return this.info.fundationDay }

  /**
   * Agrega un miembro a la organización. Lanza un error si el miembro ya existe.
   * El mensaje de error incluye el id del miembro, el tipo de organización y los ids actuales de miembros.
   */
  addMember(m: M) {
    if (!!this.info.members.get(m.id)) {
      const orgType = this.constructor.name;
      const currentMembers = Array.from(this.members.keys()).join(', ');
      throw new Error(
        `Error en addMember (${orgType}):\n` +
        `- El miembro con id '${m.id}' ya existe en la organización.\n` +
        `- Miembros actuales: [${currentMembers}]`
      );
    }
    this.info.members.set(m.id, m);
  }

  abstract getData(): D;
}