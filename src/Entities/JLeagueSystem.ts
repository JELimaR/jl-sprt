import { IJTournamentConfig } from "../Basics/JTournament";
import { TypeStageParallelInfo } from "../Basics/Stage/JStageParallels";
import { TypeJCategory } from "../Basics/types";
import { IJDateTimeCreator } from "../Calendar/DateTime/JDateTime";

// cambiar league system por division system

interface IJCupConfig {
  tournamentConfig: IJTournamentConfig;
  stagesConfig: TypeStageParallelInfo[];
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

export interface IJLeagueSystemCreator {
  category: TypeJCategory;
  divisions: IJDivisionConfig[];
  postRegular: IJDivisionConfig[];
}

// hay uno por season
export default class JLeagueSystem {

  _regular: IJDivisionConfig[] = []; // divisions
  _postSeason: IJDivisionConfig[] = [];

  constructor(ilsc: IJLeagueSystemCreator) {  }

}