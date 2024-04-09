
// cambiar league system por division system

import { ITournamentConfig, TypeJCategory } from "../..";

interface ILevelConfig {
  level: number;
  tournamentConfig: ITournamentConfig;
  // stagesConfig: any[];
}

export interface ICupSystemCreator {
  category: TypeJCategory;
  cups: ILevelConfig[];
}

export class JCupSystem {
  _competitions: ICupSystemCreator[] = [];
  
  constructor(icsc: ICupSystemCreator) { 

   }
}


/** */
interface IDivisionConfig extends ILevelConfig {
  relegateNumber: number;
  promoteNumber: number;
  preRelegateNumber: number;
  prePromoteNumber: number;
}

export interface ILeagueSystemCreator {
  category: TypeJCategory;
  divisions: IDivisionConfig[];
  postRegular: IDivisionConfig[];
}

// hay uno por season
export default class LeagueSystem {

  _regular: IDivisionConfig[] = []; // divisions
  _postSeason: IDivisionConfig[] = [];

  constructor(ilsc: ILeagueSystemCreator) {  }

}