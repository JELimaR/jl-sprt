import { TypeHalfWeekOfYear } from "../../../Calendar/DateTime/types";
import JSingleElmination from "./JSingleElmination";
import JTeam from "../../JTeam";
import JMatch from "../../Match/JMatch";
import { arr2 } from "../../types";
import { IJTournamentConfig } from "../../JTournament";
import { IJTeamTableItem } from "../../Rank/JTeamTableItem";
import { JRankCalculator } from "../../Rank/JRank";
import JSubStage, { IJSubStageCreator, IJSubStageInfo, TypeBomboData } from "../JSubStage";

type TypeDrawRulePlayoff = {}

export interface IJStagePlayoffInfo extends IJSubStageInfo {
	roundsNumber: number;
	roundHalfWeeks: arr2<TypeHalfWeekOfYear>[];
  roundHalfWeeksSchedule: TypeHalfWeekOfYear[];
	drawRulesValidate: TypeDrawRulePlayoff[];
}

export interface IJStagePlayoffCreator extends IJSubStageCreator {
	info: IJStagePlayoffInfo
}

export default class JStagePlayoff extends JSubStage {
	_playoff: JSingleElmination;

	_roundsNumber: number;
	_roundHalfWeeks: arr2<TypeHalfWeekOfYear>[];
  _roundHalfWeeksSchedule: TypeHalfWeekOfYear[];
	_drawRulesValidate: TypeDrawRulePlayoff[];
	
	constructor (ispc: IJStagePlayoffCreator) {

		ispc.info.bombos.forEach((b: TypeBomboData) => {
			b.selectionPerTime = 1;
		})
		super(ispc);

		this._roundsNumber = ispc.info.roundsNumber;
		this._roundHalfWeeks = ispc.info.roundHalfWeeks;
  	this._roundHalfWeeksSchedule = ispc.info.roundHalfWeeksSchedule;
		this._drawRulesValidate = ispc.info.drawRulesValidate;

		// si es single elimination
    this._playoff = new JSingleElmination({
      ...ispc.info,
      // roundsNumber: spi.roundsNumber,
      // participantsNumber: spi.participantsNumber,
      season: this.tournamentConfig.season,
			id: this.config.ssId + '-P'
    })
		
	}
  get playoff(): JSingleElmination {return this._playoff}
	
	get config(): IJStagePlayoffInfo {	
		return {
			...super.config,
			roundsNumber: this._roundsNumber,
			roundHalfWeeks: this._roundHalfWeeks,
			roundHalfWeeksSchedule: this._roundHalfWeeksSchedule,
			drawRulesValidate: this._drawRulesValidate,
		}
	}

	get isFinished(): boolean {
		return this._playoff.isFinished;
	}

	get relativeTable(): IJTeamTableItem[] {
		return JRankCalculator.getTableStagePlayoff(this);
	}
	// get rank(): ITeamTableItem[] { 
	// 	return JRankCalculator.getTableStagePlayoff(this);
	// }

	drawRulesValidate(teams: arr2<JTeam>): boolean {
		return true;
	}

}