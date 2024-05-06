import JCalendar from '../../../../JCalendar/JCalendar';
import SingleElmination from './SingleElmination';
import { Event_ScheduleOfRoundMatches } from './Event_ScheduleOfRoundMatches';
import { TypeHalfWeekOfYear, JDateTime } from '../../../../JCalendar/JDateTimeModule';
import Team from '../../../../JSportModule/data/Team';
import JSerie from '../../../../JSportModule/Match/JSerie';
import Match from '../../../../JSportModule/Match/JMatch';
import { arr2 } from '../../../../JSportModule';


export interface IRoundInfo {
	num: number;
	halfweeks: arr2<TypeHalfWeekOfYear>;
	halfweekSchedule: TypeHalfWeekOfYear;
	series: JSerie[];
}

export class Round {
	private _num: number;
	private _series: JSerie[] = [];
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
	get series(): JSerie[] {return this._series }
	get matches(): Match[] { 
		let out: Match[] = [];
		this._series.forEach((serie: JSerie) => {
			serie.matches.forEach((match: Match) => {
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
		return this.matches.every((m: Match) => m.state === 'finished');
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
				dateTime: dt.getIJDateTimeCreator(),
				calendar: cal,
				round: this,
				playoff: playoff
			})
		);
	}
	
}

