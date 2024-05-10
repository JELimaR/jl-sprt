import { IJDateTimeCreator } from "../../JCalendar";
import { ICupSystemCreator, ILeagueSystemCreator } from "./Entities/LeagueSystem";
import { TypeCategoryList } from "./types";

export interface ISportOrganizationData {
  id: string;
  area: string;
  fds: string[];
  hqs: string; // headquarters
  dtC: IJDateTimeCreator;
  // memberIds: string[];
}

export interface IConfederationData extends ISportOrganizationData {
  feds: string[];
}

export interface IInstitutionData extends ISportOrganizationData {
  
}