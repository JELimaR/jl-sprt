import { JDateTime } from '../../Calendar/DateTime/JDateTime';
import { TypeHalfWeekOfYear } from '../../Calendar/DateTime/types';
import JCalendar from '../../Calendar/JCalendar';
import { arr2 } from '../types';
import JSingleElmination from '../JSingleElmination';
import JTeam from '../JTeam';
import JMatch from '../Match/JMatch';
import JSerie from '../Serie/JSerie';
import { JEventMatchsOfRoundSchedule } from './JEventMatchsOfRoundSchedule';


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

	get winners(): JTeam[] {
		let out: JTeam[] = [];
		this._series.forEach((s: JSerie) => out.push(s.winner))
		return out;
	}

	get losers(): JTeam[] {
		let out: JTeam[] = [];
		this._series.forEach((s: JSerie) => {
			out.push(s.loser)})
		return out;
	}

	get isFinished(): boolean {
		return this.matches.every((m: JMatch) => m.state === 'finished');
	}

	generateSeriesAssignations(cal: JCalendar, playoff: JSingleElmination, roundCreateAt: JDateTime): void {
		let dt = JDateTime.createFromHalfWeekOfYearAndYear(
			this._halfweekMatchDateAssignation,
			playoff.config.temp,
			'middle'
		);
		if (roundCreateAt.absolute > dt.absolute) {
			dt = roundCreateAt.copy();
			dt.addInterv(1);
		}
		cal.addEvent(
			new JEventMatchsOfRoundSchedule({
				dateTime: dt.getIJDateTimeCreator(),
				calendar: cal,
				round: this,
				config: playoff.config
			})
		);
	}
	
}

