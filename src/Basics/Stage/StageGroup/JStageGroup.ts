import { TypeHalfWeekOfYear } from "../../../Calendar/DateTime/types";
import JLeague from "./JLeague";
import { JRankCalculator } from "../../Rank/JRank";
import JTeam from "../../JTeam";
import { IJTeamTableItem } from "../../Rank/JTeamTableItem";
import JSubStage, { IJSubStageCreator, IJSubStageInfo } from "../JSubStage";


type TypeDrawRuleLeague = {}


export interface IJStageGroupInfo extends IJSubStageInfo {
	groupsNumber: number;
	participantsPerGroup: number[];
	fechHalfWeeks: TypeHalfWeekOfYear[];
  fechHalfWeeksSchedule: TypeHalfWeekOfYear[];
	drawRulesValidate: TypeDrawRuleLeague[];
	allowedDraw: boolean
}

export interface IJStageGroupCreator extends IJSubStageCreator {
	info: IJStageGroupInfo
}

export default class JStageGroup extends JSubStage {
	_groups: JLeague[] = []; // JLeague
	
	_groupsNumber: number;
	_participantsPerGroup: number[];
	_fechHalfWeeks: TypeHalfWeekOfYear[];
  _fechHalfWeeksSchedule: TypeHalfWeekOfYear[];
	_drawRulesValidate: TypeDrawRuleLeague[];
	_allowedDraw: boolean;

	// constructor() {
	constructor(isgc: IJStageGroupCreator) {
		super(isgc)
		
		this._groupsNumber = isgc.info.groupsNumber; // debe ser entre 1 y 26
		this._participantsPerGroup = isgc.info.participantsPerGroup;
		this._fechHalfWeeks = isgc.info.fechHalfWeeks;
		this._fechHalfWeeksSchedule = isgc.info.fechHalfWeeksSchedule;
		this._drawRulesValidate = isgc.info.drawRulesValidate;
		this._allowedDraw = isgc.info.allowedDraw;

		for (let i = 0; i < isgc.info.groupsNumber; i++) {
			this._groups.push(
				new JLeague({
					...isgc.info,
					season: this.tournamentConfig.season,
					participantsNumber: isgc.info.participantsPerGroup[i],
					id: this.config.ssId + '-G' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i],
				})
			)
		}
	}

	get groups(): JLeague[] {return this._groups}
	get config(): IJStageGroupInfo {
		return {
			...super.config,
			groupsNumber: this._groupsNumber,
			participantsPerGroup: this._participantsPerGroup,
			fechHalfWeeks: this._fechHalfWeeks,
			fechHalfWeeksSchedule: this._fechHalfWeeksSchedule,
			drawRulesValidate: this._drawRulesValidate,
			allowedDraw: this._allowedDraw,
		}
	}

	get relativeTable(): IJTeamTableItem[] {
		return JRankCalculator.getTableStageGroup(this);
	}
	
	get rank(): IJTeamTableItem[] { 
		return JRankCalculator.getTableStageGroup(this);
	}

	get isFinished(): boolean {
		return this._groups.every((g: JLeague) => g.isFinished);
	}

	drawRulesValidate(teams: JTeam[]): boolean {
		// let teamsIds = teams.map(t => t.id);
		// if (this._stageId === 0 && teamsIds.includes('T1010')) {
		// 	return teamsIds.includes('T1030')
		// }
		return true;
	}
	
}