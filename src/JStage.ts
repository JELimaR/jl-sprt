import JLeague from './Basics/JLeague';
import { TypeHalfWeekOfYear } from './Calendar/DateTime/types';
import JTeam from './Basics/JTeam'

export type TypeStageInfo = 
	| {
  	type: 'group',
		stageGroupeInfo:  IJStageGroupInfo
	}
	| {
		type: 'playoff'
	}

export interface IJStageInfo { 
	fechHalfWeeks: TypeHalfWeekOfYear[];
  fechHalfWeeksSchedule: TypeHalfWeekOfYear[];
	temp: number;
}

export default abstract class JStage {

	abstract get rank(): any;

	static createStage(info: TypeStageInfo): JStage {
		if (info.type === 'group') {
			return new JStageGroup(info.stageGroupeInfo);
		} else {
			return new JStagePlayOff();
		}
	}
}
/*************************************************************************************** */
/*
interface IJLeagueConfig {
  partsNumber: number;
  isIV: boolean;
  fechHalfWeeks: TypeHalfWeekOfYear[];
  fechHalfWeeksSchedule: TypeHalfWeekOfYear[];
  temp: number;
}
*/
export interface IJStageGroupInfo extends IJStageInfo {
	groupsNumber: number;
	participantsPerGroup: number[];
	isIV: boolean;
	drawRulesValidate: (groups: Array<JTeam>) => boolean;
	bombos: number[];
}

export class JStageGroup extends JStage {
	_groups: JLeague[] = []; // JLeague
	_config: IJStageGroupInfo;

	constructor(sgi: IJStageGroupInfo) {
		super()
		this._config = sgi;
		for (let i = 0; i < sgi.groupsNumber; i++) {
			this._groups.push(
				new JLeague({
					...sgi,
					partsNumber: sgi.participantsPerGroup[i]
				})
			)
		}
	}

	get groups(): JLeague[] {return this._groups}
	get config(): IJStageGroupInfo {return this._config}
	
	get rank(): number { return -1 }
}



export class JStagePlayOff extends JStage {

	get rank(): number { return -1 }

	// statics 
	static maxNumberRound(partsNumber: number): number { // mover a JCup
		let out: number = 0;
		while ( (partsNumber % 2) === 0 ) {
			out++;
			partsNumber /= 2;
		}
		return out;
	}

	static winnersInMaxNumberRound(partsNumber: number): number {
		while ( (partsNumber % 2) === 0 ) {
			partsNumber /= 2;
		}
		return partsNumber;
	}
}

class JStageWithLevels extends JStage {

	_levelsNumber: number = 0;

	get rank(): number { return -1 }

}