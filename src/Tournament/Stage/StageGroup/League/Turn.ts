import JCalendar from "../../../../JCalendar/JCalendar";
import League from "./League";
import { Event_ScheduleOfTurnMatches } from "./Event_ScheduleOfTurnMatches";
import { JDateTime, TypeHalfWeekOfYear } from "../../../../JCalendar/JDateTimeModule";
import { A_Match } from "../../../../JSportModule/Match/A_Match";

export interface ITurnInfo {
	num: number;
	halfweek: TypeHalfWeekOfYear;
	halfweekSchedule: TypeHalfWeekOfYear;
	matches: A_Match<any>[];
}

export /*default*/ class Turn {
	private _num: number;
	private _matches: A_Match<any>[] = [];
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
	get matches(): A_Match<any>[] { return this._matches }

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
				dateTime: dt.getIJDateTimeCreator(),
				calendar: cal,
				turn: this,
				// leagueData: league.getData()
				league
			})
		);
	}
}