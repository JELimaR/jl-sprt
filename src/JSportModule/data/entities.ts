import { IJDateTimeCreator } from "../../JCalendar/JDateTimeModule";

export interface ISportOrganizationData {
  id: string;
  areaAsosiatedId: string;
  founderIds: string[];
  headquarters: string;
  dateTimeCreation: IJDateTimeCreator;
}

export interface IConfederationData extends ISportOrganizationData {
  federationIds: string[];
}
export interface IFederationData extends ISportOrganizationData {
  institutionIds: string[];
  divisionSystem: any;
}
export interface IInstitutionData extends ISportOrganizationData {
  
}