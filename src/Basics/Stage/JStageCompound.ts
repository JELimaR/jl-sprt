// import JCalendar from "../../Calendar/JCalendar";
// import { IJTournamentConfig } from "../../JTournament";
// import JTeam from "../JTeam";
// import { ITeamTableItem } from "../Rank/JTeamTableItem";
// import { arr3 } from "../types";
// import JStage, { IJStageInfo, TypeStageInfo } from "./JStage";

// export interface IJStageCompoundInfo {
  
// }

// export class JStageCompound extends JStage {

// 	_stages: JStage[] = [];
// 	_levelsNumber: number = 0;

// 	constructor(tournamentConfig: IJTournamentConfig, stagesInfo: arr3<TypeStageInfo>, cal: JCalendar) {
// 		super(tournamentConfig, stagesInfo[0].info);
// 	}


// 	get config(): IJStageInfo {
// 		throw new Error('Method not implemented.');
// 	}
// 	get relativeTable(): ITeamTableItem[] { return [] }
// 	get rank(): number { return -1 }
// 	drawRulesValidate(teams: JTeam[]): boolean {
// 		return true;
// 	}
// }