import { JCalendar, JDateTime, TypeHalfWeekOfYear } from "jl-calendar";
import { League } from "./League";
import { Event_ScheduleOfTurnMatches } from "./Event_ScheduleOfTurnMatches";
import { AnyMatch } from "jl-sprt-core";

export interface ITurnInfo {
	num: number;
	halfweek: TypeHalfWeekOfYear;
	halfweekSchedule: TypeHalfWeekOfYear;
	matches: AnyMatch[];
}

export /*default*/ class Turn {
	private _num: number;
	private _matches: AnyMatch[] = [];
	private _halfWeek: TypeHalfWeekOfYear;
	private _halfweekSchedule: TypeHalfWeekOfYear;

	constructor(fi: ITurnInfo) {
		this._num = fi.num;
		this._halfWeek = fi.halfweek;
		this._halfweekSchedule = fi.halfweekSchedule;
		this._matches = fi.matches; // ver como se hace
	}

	get num(): number { return this._num }
	get halfWeek(): TypeHalfWeekOfYear { return this._halfWeek }
	get matches(): AnyMatch[] { return this._matches }

	get isFinished(): boolean {
		return this._matches.every((m) => m.state === 'finished');
	}

	generateMatchOfTurnScheduleEvents(cal: JCalendar, league: League): void {
		const dt = JDateTime.createFromHalfWeekOfYearAndYear(
			this._halfweekSchedule,
			league.info.season,
			'start'
		);
		dt.addInterv();
		cal.addEvent(
			new Event_ScheduleOfTurnMatches({
				dateTime: dt.getCreator(),
				calendar: cal,
				turn: this,
				// leagueData: league.getData()
				league
			})
		);
	}
}