import { JDateTime } from "../../Calendar/DateTime/JDateTime";
import { TypeHalfWeekOfYear } from "../../Calendar/DateTime/types";
import JCalendar from "../../Calendar/JCalendar";
import JLeague from "../JLeague";
import JMatch from "../Match/JMatch";
import { JEventMatchsOfFechSchedule } from "./JEventMatchsOfFechSchedule";

type TypeFechState =
	| 'init'


export interface IJFechInfo {
	num: number;
	halfweek: TypeHalfWeekOfYear;
	halfweekMatchDateAssignation: TypeHalfWeekOfYear;
	matches: JMatch[];
}

export class JFech {
	private _num: number;
	private _matches: JMatch[] = [];
	private _halfWeek: TypeHalfWeekOfYear;
	private _halfweekMatchDateAssignation: TypeHalfWeekOfYear;

	constructor(fi: IJFechInfo) {
		this._num = fi.num;
		this._halfWeek = fi.halfweek;
		this._halfweekMatchDateAssignation = fi.halfweekMatchDateAssignation;
		this._matches = fi.matches; // ver como se hace
	}

	get num(): number { return this._num }
	get halfWeek(): TypeHalfWeekOfYear { return this._halfWeek }
	get matches(): JMatch[] { return this._matches }

	generateMatchesAssignations(cal: JCalendar, league: JLeague): void {
		const dt = JDateTime.halfWeekOfYearToDateTime(
			this._halfweekMatchDateAssignation,
			league.config.temp,
			'middle'
		);
		cal.addEvent(
			new JEventMatchsOfFechSchedule({
				dateTime: dt.getIJDateTimeCreator(),
				calendar: cal,
				fech: this,
				config: league.config
			})
		);
	}
}