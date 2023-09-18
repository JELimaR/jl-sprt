import { JDateTime } from "../../../../Calendar/DateTime/JDateTime";
import { TypeHalfWeekOfYear } from "../../../../Calendar/DateTime/types";
import JCalendar from "../../../../Calendar/JCalendar";
import League from "./League";
import JMatch from "../../../Match/JMatch";
import { Event_ScheduleOfTurnMatches } from "./Event_ScheduleOfTurnMatches";

export interface ITurnInfo {
	num: number;
	halfweek: TypeHalfWeekOfYear;
	halfweekSchedule: TypeHalfWeekOfYear;
	matches: JMatch[];
}

export /*default*/ class Turn {
	private _num: number;
	private _matches: JMatch[] = [];
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
	get matches(): JMatch[] { return this._matches }

	get isFinished(): boolean {
		return this._matches.every((m: JMatch) => m.state === 'finished');
	}

	generateMatchOfTurnScheduleEvents(cal: JCalendar, league: League): void {
		const dt = JDateTime.createFromHalfWeekOfYearAndYear(
			this._halfweekSchedule,
			league.info.season,
			'start'
		);
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