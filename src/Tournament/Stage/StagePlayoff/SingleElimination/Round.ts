import { JCalendar, TypeHalfWeekOfYear, JDateTime } from "jl-calendar";
import SingleElmination from './SingleElmination';
import { Event_ScheduleOfRoundMatches } from './Event_ScheduleOfRoundMatches';
import { arr2, AnyTeam, A_Serie, AnyMatch } from 'jl-sprt-core';

export interface IRoundInfo {
	num: number;
	halfweeks: arr2<TypeHalfWeekOfYear>;
	halfweekSchedule: TypeHalfWeekOfYear;
	series: A_Serie<any, any>[];
}

export class Round {
	private _num: number;
	private _series: A_Serie<any, any>[] = [];
	private _halfWeeks: arr2<TypeHalfWeekOfYear>;
	private _halfweekSchedule: TypeHalfWeekOfYear;

	constructor(ri: IRoundInfo) {
		this._num = ri.num;
		this._halfWeeks = ri.halfweeks;
		this._halfweekSchedule = ri.halfweekSchedule;
		this._series = ri.series; // ver como se hace
	}

	get num(): number { return this._num }
	get halfWeek(): arr2<TypeHalfWeekOfYear> { return this._halfWeeks }
	get series(): A_Serie<any, any>[] {return this._series }
	get matches(): AnyMatch[] { 
		let out: AnyMatch[] = [];
		this._series.forEach((serie: any /*AnySerie */) => {
			serie.matches.forEach((match: AnyMatch) => {
				out.push(match);
			})
		})
		return out;
	}

	 get winners(): AnyTeam[] {
		 let out: AnyTeam[] = [];
		this._series.forEach((s) => out.push(s.winner))
		return out;
	}

	 get losers(): AnyTeam[] {
		 let out: AnyTeam[] = [];
		this._series.forEach((s) => {
			out.push(s.loser)})
		return out;
	}

	get isFinished(): boolean {
		return this.matches.every((m) => m.state === 'finished');
	}

	generateMatchOfRoundScheduleEvents(cal: JCalendar, playoff: SingleElmination): void {
		let dt = JDateTime.createFromHalfWeekOfYearAndYear(
			this._halfweekSchedule,
			playoff.info.season,
			'start', 0
		);
		if (cal.now.absolute >= dt.absolute) {
			dt = cal.now;
			dt.addInterv(1);
      if (cal.now.absolute - dt.absolute > 50) {

        throw new Error(`stop
        En Round.generateMatchOfRoundScheduleEvents`)
      }
		}
		cal.addEvent(
			new Event_ScheduleOfRoundMatches({
				dateTime: dt.getCreator(),
				calendar: cal,
				round: this,
				playoff: playoff
			})
		);
	}
	
}

