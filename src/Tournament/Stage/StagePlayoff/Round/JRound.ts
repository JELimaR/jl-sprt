import { JDateTime } from '../../../../Calendar/DateTime/JDateTime';
import { TypeHalfWeekOfYear } from '../../../../Calendar/DateTime/types';
import JCalendar from '../../../../Calendar/JCalendar';
import { arr2 } from '../../../types';
import SingleElmination from '../SingleElmination';
import Team from '../../../Team';
import JMatch from '../../../Match/JMatch';
import JSerie from '../../../Match/JSerie';
import { Event_ScheduleOfRoundMatches } from './Event_ScheduleOfRoundMatches';


export interface IJRoundInfo {
	num: number;
	halfweeks: arr2<TypeHalfWeekOfYear>;
	halfweekSchedule: TypeHalfWeekOfYear;
	series: JSerie[];
}

export class JRound {
	private _num: number;
	private _series: JSerie[] = [];
	private _halfWeeks: arr2<TypeHalfWeekOfYear>;
	private _halfweekSchedule: TypeHalfWeekOfYear;

	constructor(ri: IJRoundInfo) {
		this._num = ri.num;
		this._halfWeeks = ri.halfweeks;
		this._halfweekSchedule = ri.halfweekSchedule;
		this._series = ri.series; // ver como se hace
	}

	get num(): number { return this._num }
	get halfWeek(): arr2<TypeHalfWeekOfYear> { return this._halfWeeks }
	get series(): JSerie[] {return this._series }
	get matches(): JMatch[] { 
		let out: JMatch[] = [];
		this._series.forEach((serie: JSerie) => {
			serie.matches.forEach((match: JMatch) => {
				out.push(match);
			})
		})
		return out;
	}

	get winners(): Team[] {
		let out: Team[] = [];
		this._series.forEach((s: JSerie) => out.push(s.winner))
		return out;
	}

	get losers(): Team[] {
		let out: Team[] = [];
		this._series.forEach((s: JSerie) => {
			out.push(s.loser)})
		return out;
	}

	get isFinished(): boolean {
		return this.matches.every((m: JMatch) => m.state === 'finished');
	}

	generateMatchOfRoundScheduleEvents(cal: JCalendar, playoff: SingleElmination/*, roundCreateAt: JDateTime*/): void {
		let dt = JDateTime.createFromHalfWeekOfYearAndYear(
			this._halfweekSchedule,
			playoff.info.season,
			'middle'
		);
		// if (roundCreateAt.absolute > dt.absolute) {
		// 	dt = roundCreateAt.copy();
		// 	dt.addInterv(1);
		// }
		cal.addEvent(
			new Event_ScheduleOfRoundMatches({
				dateTime: dt.getIJDateTimeCreator(),
				calendar: cal,
				round: this,
				playoff: playoff
			})
		);
	}
	
}

