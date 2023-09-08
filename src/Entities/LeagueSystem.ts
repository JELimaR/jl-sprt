import { ITournamentConfig } from "../Tournament/Tournament";
// import { TypeStageParallelInfo } from "../Basics/Stage/JStageParallels";
import { TypeJCategory } from "../Tournament/types";
import { IJDateTimeCreator } from "../Calendar/DateTime/JDateTime";

// cambiar league system por division system

interface IJCupConfig {
  tournamentConfig: ITournamentConfig;
  stagesConfig: any[];
}

export interface IJCupSystemCreator {
  category: TypeJCategory;
  cups: IJCupConfig[];
}

export class JCupSystem {
  _competitions: IJCupSystemCreator[] = [];
  
  constructor(icsc: IJCupSystemCreator) { 

   }
}


/** */
interface IJDivisionConfig extends IJCupConfig {
  relegateNumber: number;
  promoteNumber: number;
  preRelegateNumber: number;
  prePromoteNumber: number;
}

export interface ILeagueSystemCreator {
  category: TypeJCategory;
  divisions: IJDivisionConfig[];
  postRegular: IJDivisionConfig[];
}

// hay uno por season
export default class LeagueSystem {

  _regular: IJDivisionConfig[] = []; // divisions
  _postSeason: IJDivisionConfig[] = [];

  constructor(ilsc: ILeagueSystemCreator) {  }

}