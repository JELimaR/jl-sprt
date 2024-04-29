import { IJDateTimeCreator } from "../../JCalendar";
import { ICupSystemCreator, ILeagueSystemCreator } from "./Entities/LeagueSystem";
import { TypeCategoryList } from "./types";

export interface ISportOrganizationData {
  id: string;
  areaAsosiatedId: string;
  founderIds: string[];
  headquarters: string;
  dateTimeCreation: IJDateTimeCreator;
  // memberIds: string[];
}

export interface IConfederationData extends ISportOrganizationData {
  federationIds: string[];
}

export interface IInstitutionData extends ISportOrganizationData {
  
}