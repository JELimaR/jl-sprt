import { JDateTime } from '../../Calendar/DateTime/JDateTime';
import { TypeHalfWeekOfYear } from '../../Calendar/DateTime/types';
import JTeam from '../JTeam';
import JMatch from '../Match/JMatch';
import {arr2} from '../scheduling';
import JSerie from '../Serie/JSerie';


export interface IJRoundInfo {
	num: number;
	halfweeks: arr2<TypeHalfWeekOfYear>;
	halfweekMatchDateAssignation: TypeHalfWeekOfYear;
	series: JSerie[];
}

export class JRound {
	private _num: number;
	private _series: JSerie[] = [];
	private _halfWeeks: arr2<TypeHalfWeekOfYear>;
	private _halfweekMatchDateAssignation: TypeHalfWeekOfYear;

	constructor(ri: IJRoundInfo) {
		this._num = ri.num;
		this._halfWeeks = ri.halfweeks;
		this._halfweekMatchDateAssignation = ri.halfweekMatchDateAssignation;
		this._series = ri.series; // ver como se hace
	}

	get num(): number { return this._num }
	get halfWeek(): arr2<TypeHalfWeekOfYear> { return this._halfWeeks }
	//get matches(): JMatch[] { return this._matches }

	/*
	generateSeriesAssignations(cal: JCalendar, cup: JCup): void {
		const dt = JDateTime.halfWeekOfYearToDateTime(
			this._halfweekMatchDateAssignation,
			cup.config.temp,
			'middle'
		);
		cal.addEvent(
			new JEventMatchsOfRoundSchedule({
				dateTime: dt.getIJDateTimeCreator(),
				calendar: cal,
				round: this,
				config: cup.config
			})
		);
	}
	*/
}

