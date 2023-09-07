import { JDateTime } from "../../../../Calendar/DateTime/JDateTime";
import { TypeHalfWeekOfYear } from "../../../../Calendar/DateTime/types";
import JCalendar from "../../../../Calendar/JCalendar";
import League from "../League";
import JMatch from "../../../Match/JMatch";
import { Event_MatchsOfTurnSchedule } from "./Event_MatchsOfTurnSchedule";

export interface ITurnInfo {
	num: number;
	halfweek: TypeHalfWeekOfYear;
	halfweekMatchDateAssignation: TypeHalfWeekOfYear;
	matches: JMatch[];
}

export class Turn {
	private _num: number;
	private _matches: JMatch[] = [];
	private _halfWeek: TypeHalfWeekOfYear;
	private _halfweekMatchDateAssignation: TypeHalfWeekOfYear;

	constructor(fi: ITurnInfo) {
		this._num = fi.num;
		this._halfWeek = fi.halfweek;
		this._halfweekMatchDateAssignation = fi.halfweekMatchDateAssignation;
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
			this._halfweekMatchDateAssignation,
			league.info.season,
			'start'
		);
		cal.addEvent(
			new Event_MatchsOfTurnSchedule({
				dateTime: dt.getIJDateTimeCreator(),
				calendar: cal,
				matchHWeek: this,
				// leagueData: league.getData()
				league
			})
		);
	}
}