
import { Federation } from "./Federation";
import Team from "../Team";
import { Continent } from "./GeogEntity";
import LeagueSystem, { CupSystem, ICupSystemCreator, IDivisionConfig, ILeagueSystemCreator } from "./LeagueSystem";
import SportOrganization, { ISportOrganizationCreator, ISportOrganizationData } from "./SportOrganization";

export interface IConfederationData extends ISportOrganizationData {

}

export interface IConfederationCreator extends ISportOrganizationCreator<Continent, Federation> {
  
}

export class Confederation extends SportOrganization<Continent, Federation, IConfederationData, IConfederationCreator> {

  constructor(ifc: IConfederationCreator) {
    super(ifc)
  }

  getData(): IConfederationData {
    const members: string[] = [];
    this.members.forEach(i => members.push(i.id))
    return {
      i: this.id, n: this.name, sn: this.shortName, fd: this.foundationDate.getDate().dayAbsolute,
      aa: this.areaAsosiated.id, hq: this.headquarters.id,
      fs: this.founderMembers.map(i => i.id), ms: members,
    }
  }

}